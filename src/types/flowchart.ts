import type { Node } from './node';

// フローチャート特有のノードタイプ
export type FlowchartNodeType =
  | 'start'
  | 'end'
  | 'process'
  | 'decision'
  | 'input'
  | 'output'
  | 'subroutine'
  | 'database'
  | 'custom';

export interface FlowchartNode extends Node {
  nodeType: FlowchartNodeType;
  description?: string;
}
