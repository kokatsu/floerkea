import type { Direction } from '../types/direction';
import { DirectionUtil } from '../types/direction';
import type { Edge, EdgeLineType } from '../types/edge';
import type { Node, NodeShape } from '../types/node';
import { ErrorCodes, ParseError } from './errors';

/**
 * ノードIDの妥当性チェック
 */
export const validateNodeId = (
  id: string,
  line: number,
  column: number,
): void => {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new ParseError(
      line,
      column,
      ErrorCodes.INVALID_SYNTAX,
      `Invalid node ID: ${id}. Node IDs must contain only letters, numbers, underscores, and hyphens.`,
    );
  }
};

/**
 * ノード形状の妥当性チェック
 */
export const validateNodeShape = (
  shape: string,
  line: number,
  column: number,
): NodeShape => {
  const validShapes: NodeShape[] = [
    'square',
    'round',
    'stadium',
    'subroutine',
    'cylindrical',
    'circle',
    'asymmetric',
    'rhombus',
    'hexagon',
    'parallelogram',
    'parallelogram-alt',
    'trapezoid',
    'trapezoid-alt',
    'double-circle',
  ];
  if (!validShapes.includes(shape as NodeShape)) {
    throw new ParseError(
      line,
      column,
      ErrorCodes.INVALID_SHAPE,
      `Invalid node shape: ${shape}. Valid shapes are: ${validShapes.join(', ')}`,
    );
  }
  return shape as NodeShape;
};

/**
 * エッジの線種の妥当性チェック
 */
export const validateEdgeLineType = (
  lineType: string,
  line: number,
  column: number,
): EdgeLineType => {
  const validLineTypes: EdgeLineType[] = ['solid', 'dotted', 'thick'];
  if (!validLineTypes.includes(lineType as EdgeLineType)) {
    throw new ParseError(
      line,
      column,
      ErrorCodes.INVALID_EDGE,
      `Invalid edge line type: ${lineType}. Valid line types are: ${validLineTypes.join(', ')}`,
    );
  }
  return lineType as EdgeLineType;
};

/**
 * グラフ内のノード参照の妥当性チェック
 */
export const validateNodeReferences = (nodes: Node[], edges: Edge[]): void => {
  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const edge of edges) {
    if (!nodeIds.has(edge.from)) {
      throw new ParseError(
        0, // 行番号は実装時に適切な値を設定
        0,
        ErrorCodes.UNDEFINED_NODE,
        `Edge references undefined node: ${edge.from}`,
      );
    }
    if (!nodeIds.has(edge.to)) {
      throw new ParseError(
        0,
        0,
        ErrorCodes.UNDEFINED_NODE,
        `Edge references undefined node: ${edge.to}`,
      );
    }
  }
};

/**
 * グラフの方向の妥当性チェック
 */
export const validateDirection = (
  direction: string,
  line: number,
  column: number,
): Direction => {
  if (!DirectionUtil.isValid(direction)) {
    throw new ParseError(
      line,
      column,
      ErrorCodes.INVALID_DIRECTION,
      `Invalid graph direction: ${direction}. Valid directions are: TB, TD, BT, LR, RL`,
    );
  }
  return direction as Direction;
};

/**
 * 色指定の妥当性チェック
 */
export const validateColor = (
  color: string,
  line: number,
  column: number,
): string => {
  // 16進数カラーコード または CSS カラー名
  const hexColorPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const cssColorPattern = /^[a-zA-Z]+$/;

  if (!hexColorPattern.test(color) && !cssColorPattern.test(color)) {
    throw new ParseError(
      line,
      column,
      ErrorCodes.INVALID_STYLE,
      `Invalid color value: ${color}. Use hex color code or CSS color name.`,
    );
  }
  return color;
};
