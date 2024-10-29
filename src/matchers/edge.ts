import type { EdgeLineType } from '../types/edge';
import { ErrorCodes, ParseError } from '../utils/errors';
import type { NodeMatchResult } from './node';
import { NodeMatcher } from './node';

/**
 * エッジのマッチング結果
 */
export type EdgeMatchResult = {
  from: {
    id: string;
    node?: NodeMatchResult;
  };
  to: {
    id: string;
    node?: NodeMatchResult;
  };
  lineType: EdgeLineType;
  label?: string;
  original: string;
};

export type EdgeMatcherResult = {
  matched: boolean;
  result?: EdgeMatchResult;
  error?: ParseError;
};

/**
 * エッジ定義のマッチャー
 */
export class EdgeMatcher {
  private nodeMatcher: NodeMatcher;

  constructor() {
    this.nodeMatcher = new NodeMatcher();
  }

  private connectors: Array<{
    type: EdgeLineType;
    pattern: string;
    example: string;
  }> = [
    {
      type: 'solid',
      pattern: '-->',
      example: 'A --> B',
    },
    {
      type: 'dotted',
      pattern: '-.->',
      example: 'A -.-> B',
    },
    {
      type: 'thick',
      pattern: '==>',
      example: 'A ==> B',
    },
  ];

  /**
   * エッジ定義文字列のパターンマッチを行う
   */
  match(text: string, line = 1, column = 1): EdgeMatcherResult {
    const trimmed = text.trim();

    // ノード形状とラベルを含むより柔軟なパターン
    const connectorPattern = this.connectors.map((c) => c.pattern).join('|');
    const nodePattern =
      '[A-Za-z0-9_-]+(?:\\s*(?:\\[[^\\]]*\\]|\\([^)]*\\)|\\{[^}]*\\}|\\{\\{[^}]*\\}\\}|\\(\\([^)]*\\)\\)|\\[\\[[^\\]]*\\]\\]|>(?:[^\\]]*)\\]|\\[\\/[^\\/]*\\/\\]|\\[\\\\[^\\\\]*\\\\\\]|\\[\\/[^\\\\]*\\\\\\]|\\[\\\\[^\\/]*\\/\\]|\\(\\(\\([^)]*\\)\\)\\)))?';
    const pattern = new RegExp(
      `^(${nodePattern})\\s*(${connectorPattern})\\s*(?:\\|([^|]+)\\|)?\\s*(${nodePattern})$`,
    );

    const match = trimmed.match(pattern);
    if (!match) {
      return {
        matched: false,
        error: new ParseError(
          line,
          column,
          ErrorCodes.INVALID_SYNTAX,
          `Invalid edge definition: ${text}. Expected format: "nodeA --> nodeB" or "nodeA -->|label| nodeB"`,
        ),
      };
    }

    const [, fromPart, connector, label, toPart] = match;

    // fromノードの解析
    const fromId = this.extractNodeId(fromPart);
    let fromNode: NodeMatchResult | undefined;

    // ノード形状がある場合のみNodeMatcherを使用
    if (fromPart.length > fromId.length) {
      const fromNodeText = fromPart.slice(fromId.length).trim();
      const fromNodeMatch = this.nodeMatcher.match(fromNodeText);
      if (fromNodeMatch.matched && fromNodeMatch.result) {
        fromNode = fromNodeMatch.result;
      }
    }

    // toノードの解析
    const toId = this.extractNodeId(toPart);
    let toNode: NodeMatchResult | undefined;

    // ノード形状がある場合のみNodeMatcherを使用
    if (toPart.length > toId.length) {
      const toNodeText = toPart.slice(toId.length).trim();
      const toNodeMatch = this.nodeMatcher.match(toNodeText);
      if (toNodeMatch.matched && toNodeMatch.result) {
        toNode = toNodeMatch.result;
      }
    }

    return {
      matched: true,
      result: {
        from: {
          id: fromId,
          node: fromNode,
        },
        to: {
          id: toId,
          node: toNode,
        },
        lineType: this.determineLineType(connector),
        label: label?.trim(),
        original: trimmed,
      },
    };
  }

  /**
   * 文字列からノードIDを抽出
   */
  private extractNodeId(text: string): string {
    const match = text.match(/^([A-Za-z0-9_-]+)/);
    return match ? match[1] : text;
  }

  /**
   * 矢印の種類を判定
   */
  private determineLineType(connector: string): EdgeLineType {
    if (connector.includes('=')) return 'thick';
    if (connector.includes('-.')) return 'dotted';
    return 'solid';
  }

  /**
   * エッジをMermaid記法の文字列にフォーマット
   */
  format(
    from: { id: string; node?: NodeMatchResult },
    to: { id: string; node?: NodeMatchResult },
    lineType: EdgeLineType = 'solid',
    label?: string,
  ): string {
    let connector: string;
    switch (lineType) {
      case 'thick':
        connector = '==>';
        break;
      case 'dotted':
        connector = '-.->';
        break;
      default:
        connector = '-->';
    }

    const fromStr = from.node
      ? this.nodeMatcher.format(from.node.shape, from.node.label)
      : from.id;

    const toStr = to.node
      ? this.nodeMatcher.format(to.node.shape, to.node.label)
      : to.id;

    if (label) {
      return `${fromStr} ${connector}|${label}| ${toStr}`;
    }
    return `${fromStr} ${connector} ${toStr}`;
  }

  /**
   * エッジ定義が有効かどうかを検証
   */
  validate(text: string, line = 1, column = 1): ParseError[] {
    const errors: ParseError[] = [];

    // 基本的な構文チェック
    if (!text.trim()) {
      errors.push(
        new ParseError(
          line,
          column,
          ErrorCodes.INVALID_SYNTAX,
          'Empty edge definition',
        ),
      );
      return errors;
    }

    const result = this.match(text, line, column);
    if (!result.matched) {
      if (result.error) {
        errors.push(result.error);
      }
      return errors;
    }

    if (result.result) {
      const { from, to } = result.result;

      // ノードIDの文字数制限チェック
      if (from.id.length > 50) {
        errors.push(
          new ParseError(
            line,
            column,
            ErrorCodes.INVALID_SYNTAX,
            'Source node ID is too long (max 50 characters)',
          ),
        );
      }

      if (to.id.length > 50) {
        errors.push(
          new ParseError(
            line,
            column + text.indexOf(to.id),
            ErrorCodes.INVALID_SYNTAX,
            'Target node ID is too long (max 50 characters)',
          ),
        );
      }
    }

    return errors;
  }
}
