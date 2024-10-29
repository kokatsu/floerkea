import type { ParseError } from '../utils/errors'; // エラー型をimport
import type { Direction } from './direction';
import type { Edge, EdgeLineType, EdgeStyle } from './edge';
import type { Node, NodeShape, NodeStyle } from './node';

/**
 * パース結果の型定義
 */
export type ParseResult = {
  nodes: Node[]; // ノードの配列
  edges: Edge[]; // エッジの配列
  direction?: Direction; // グラフの方向
  title?: string; // グラフのタイトル
  meta?: Record<string, unknown>; // メタデータ
};

/**
 * パーサーの設定オプション
 */
export type ParserOptions = {
  strictMode?: boolean; // 厳密なパースモード
  defaultDirection?: Direction; // デフォルトの方向
  validateConnections?: boolean; // ノードの接続検証を行うか
  allowUndefinedNodes?: boolean; // 未定義ノードを許可するか
  defaultNodeShape?: NodeShape; // デフォルトのノード形状
  defaultNodeStyle?: NodeStyle; // デフォルトのノードスタイル
  defaultEdgeStyle?: EdgeStyle; // デフォルトのエッジスタイル
};

/**
 * パーサーのインターフェース
 */
export interface IParser {
  parse(content: string, options?: ParserOptions): Promise<ParseResult>;
  validate(content: string): Promise<ParseError[]>;
  format(content: string): Promise<string>;
}

export type { Edge, EdgeLineType, EdgeStyle, Node, NodeShape, NodeStyle };
