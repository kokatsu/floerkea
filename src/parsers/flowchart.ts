import { EdgeMatcher, type EdgeMatchResult } from '../matchers/edge';
import { NodeMatcher } from '../matchers/node';
import type { Direction } from '../types/direction';
import type { Edge, EdgeStyle } from '../types/edge';
import type { FlowchartNode, FlowchartNodeType } from '../types/flowchart';
import type { NodeShape, NodeStyle } from '../types/node';
import type { ParseResult } from '../types/parser';
import { ErrorCodes, ParseError } from '../utils/errors';
import { validateDirection, validateNodeReferences } from '../utils/validators';
import { BaseParser } from './base';

export class FlowchartParser extends BaseParser {
  private nodes: Map<string, FlowchartNode> = new Map();
  private edges: Edge[] = [];
  private direction: Direction = 'TD';
  private nodeMatcher: NodeMatcher;
  private edgeMatcher: EdgeMatcher;

  constructor() {
    super();
    this.nodeMatcher = new NodeMatcher();
    this.edgeMatcher = new EdgeMatcher();
  }

  async parse(content: string): Promise<ParseResult> {
    this.nodes.clear();
    this.edges = [];
    this.direction = 'TD';
    this.errors = [];

    const lines = content.split('\n');
    let definitionFound = false;

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      this.updatePosition(lineNum + 1, 0);
      const line = this.preprocessLine(lines[lineNum]);

      if (this.isEmptyLine(line)) {
        continue;
      }

      try {
        if (!definitionFound) {
          if (this.isFlowchartDefinition(line)) {
            this.parseFlowchartDefinition(line);
            definitionFound = true;
          }
          continue;
        }

        const edgeMatch = this.edgeMatcher.match(
          line,
          this.currentLine,
          this.currentColumn,
        );
        if (edgeMatch.matched && edgeMatch.result) {
          await this.handleEdgeMatch(edgeMatch.result);
        } else {
          await this.handleNodeLine(line);
        }
      } catch (error) {
        if (error instanceof ParseError) {
          this.errors.push(error);
          if (this.options.strictMode) {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    if (!definitionFound) {
      throw new ParseError(
        1,
        1,
        ErrorCodes.INVALID_SYNTAX,
        'Flowchart definition not found',
      );
    }

    if (this.options.validateConnections) {
      try {
        this.validateFlowchart();
      } catch (error) {
        if (error instanceof ParseError) {
          this.errors.push(error);
          if (this.options.strictMode) {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      direction: this.direction,
      meta: {
        type: 'flowchart',
        nodeTypes: this.getNodeTypeCounts(),
      },
    };
  }

  private isFlowchartDefinition(line: string): boolean {
    return /^(?:flowchart|graph)\s+[A-Z]{2}/i.test(line);
  }

  async validate(content: string): Promise<ParseError[]> {
    try {
      await this.parse(content);
      return this.errors;
    } catch (error) {
      if (error instanceof ParseError) {
        return [error];
      }
      throw error;
    }
  }

  private parseFlowchartDefinition(line: string): void {
    const match = line.match(/^(?:flowchart|graph)\s+([A-Z]{2})/i);
    if (!match || match.index === undefined) {
      throw new ParseError(
        this.currentLine,
        1,
        ErrorCodes.INVALID_SYNTAX,
        'Invalid flowchart definition. Expected format: flowchart <direction>',
      );
    }

    try {
      this.direction = validateDirection(
        match[1].toUpperCase(),
        this.currentLine,
        match.index + 9,
      );
    } catch (error) {
      if (error instanceof ParseError) {
        error.code = ErrorCodes.INVALID_DIRECTION;
        throw error;
      }
      throw error;
    }
  }

  private async handleNodeLine(line: string): Promise<void> {
    const idMatch = line.match(/^([A-Za-z0-9_-]+)/);
    if (!idMatch) {
      throw new ParseError(
        this.currentLine,
        1,
        ErrorCodes.INVALID_SYNTAX,
        'Invalid node definition: missing ID',
      );
    }

    const id = idMatch[1];
    const nodeText = line.slice(id.length).trim();
    const matchResult = this.nodeMatcher.match(
      nodeText,
      this.currentLine,
      this.currentColumn + id.length,
    );

    if (!matchResult.matched || !matchResult.result) {
      if (matchResult.error) {
        throw matchResult.error;
      }
      return;
    }

    const { shape, label } = matchResult.result;
    const { nodeType, style } = this.determineNodeTypeAndStyle(
      shape,
      id,
      label,
    );

    this.nodes.set(id, {
      id,
      label,
      shape,
      nodeType,
      style,
    });
  }

  private async handleEdgeMatch(edgeMatch: EdgeMatchResult): Promise<void> {
    const { from, to, lineType, label } = edgeMatch;

    // 未定義のノードを自動的に追加
    if (from.node) {
      const { shape, label } = from.node;
      const { nodeType, style } = this.determineNodeTypeAndStyle(
        shape,
        from.id,
        label,
      );
      this.nodes.set(from.id, {
        id: from.id,
        label,
        shape,
        nodeType,
        style,
      });
    }

    if (to.node) {
      const { shape, label } = to.node;
      const { nodeType, style } = this.determineNodeTypeAndStyle(
        shape,
        to.id,
        label,
      );
      this.nodes.set(to.id, {
        id: to.id,
        label,
        shape,
        nodeType,
        style,
      });
    }

    const edgeStyle = this.getEdgeStyle(label);

    this.edges.push({
      from: from.id,
      to: to.id,
      label,
      lineType,
      style: edgeStyle,
    });
  }

  private determineNodeTypeAndStyle(
    shape: NodeShape,
    id: string,
    label: string,
  ): {
    nodeType: FlowchartNodeType;
    style: NodeStyle;
  } {
    let nodeType: FlowchartNodeType = 'process';
    const lowerId = id.toLowerCase();
    const lowerLabel = label.toLowerCase();

    if (lowerId.includes('start') || lowerLabel.includes('start')) {
      nodeType = 'start';
    } else if (lowerId.includes('end') || lowerLabel.includes('end')) {
      nodeType = 'end';
    } else {
      switch (shape) {
        case 'rhombus':
          nodeType = 'decision';
          break;
        case 'parallelogram':
        case 'trapezoid':
          nodeType = 'input';
          break;
        case 'parallelogram-alt':
        case 'trapezoid-alt':
          nodeType = 'output';
          break;
        case 'subroutine':
          nodeType = 'subroutine';
          break;
        case 'cylindrical':
          nodeType = 'database';
          break;
        case 'hexagon':
          // 六角形で特定のキーワードがある場合はサブルーチンとして扱う
          if (lowerId.includes('sub') || lowerId.includes('call')) {
            nodeType = 'subroutine';
          }
          break;
        default:
          nodeType = 'process';
      }
    }

    // スタイルを決定
    const baseStyle = this.getNodeStyle(nodeType);

    // 形状に応じた追加のスタイル調整
    if (shape === 'double-circle') {
      return {
        nodeType,
        style: {
          ...baseStyle,
          strokeWidth: (baseStyle.strokeWidth || 1) * 2,
        },
      };
    }

    return {
      nodeType,
      style: baseStyle,
    };
  }

  private getNodeStyle(nodeType: FlowchartNodeType): NodeStyle {
    const baseStyle = { ...this.options.defaultNodeStyle };

    switch (nodeType) {
      case 'start':
        return { ...baseStyle, fill: '#9DB4F9', stroke: '#4B6BF5' };
      case 'end':
        return { ...baseStyle, fill: '#FFA07A', stroke: '#FF6347' };
      case 'decision':
        return { ...baseStyle, fill: '#FFE4B5', stroke: '#FFA500' };
      case 'process':
        return { ...baseStyle, fill: '#F0F8FF', stroke: '#87CEEB' };
      case 'input':
        return { ...baseStyle, fill: '#98FB98', stroke: '#3CB371' };
      case 'output':
        return { ...baseStyle, fill: '#DDA0DD', stroke: '#9370DB' };
      case 'subroutine':
        return { ...baseStyle, fill: '#F0FFF0', stroke: '#98FB98' };
      case 'database':
        return { ...baseStyle, fill: '#E6E6FA', stroke: '#9370DB' };
      default:
        return baseStyle;
    }
  }

  private getEdgeStyle(label?: string): EdgeStyle {
    const baseStyle = { ...this.options.defaultEdgeStyle };

    if (!label) {
      return baseStyle;
    }

    const lowerLabel = label.toLowerCase();
    if (lowerLabel === 'yes' || lowerLabel === 'true') {
      return { ...baseStyle, lineColor: '#4CAF50' };
    }

    if (lowerLabel === 'no' || lowerLabel === 'false') {
      return { ...baseStyle, lineColor: '#F44336' };
    }

    return baseStyle;
  }

  private validateFlowchart(): void {
    validateNodeReferences(Array.from(this.nodes.values()), this.edges);

    let hasStart = false;
    let hasEnd = false;

    for (const node of this.nodes.values()) {
      if (node.nodeType === 'start') hasStart = true;
      if (node.nodeType === 'end') hasEnd = true;
    }

    if (!hasStart) {
      this.addError(
        'Flowchart must have a start node',
        ErrorCodes.INVALID_SYNTAX,
        'warning',
      );
    }

    if (!hasEnd) {
      this.addError(
        'Flowchart must have an end node',
        ErrorCodes.INVALID_SYNTAX,
        'warning',
      );
    }
  }

  private getNodeTypeCounts(): Record<FlowchartNodeType, number> {
    const counts: Partial<Record<FlowchartNodeType, number>> = {};

    for (const node of this.nodes.values()) {
      counts[node.nodeType] = (counts[node.nodeType] || 0) + 1;
    }

    return counts as Record<FlowchartNodeType, number>;
  }
}
