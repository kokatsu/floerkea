import type { Edge, Node, ParseResult } from '../types/parser';

/**
 * パース結果をMermaid記法の文字列に変換
 */
export const toMermaid = (result: ParseResult): string => {
  const lines: string[] = [];

  // グラフの方向を追加
  lines.push(`graph ${result.direction || 'TD'}`);

  // ノードの定義を追加
  for (const node of result.nodes) {
    lines.push(formatNode(node));
  }

  // エッジの定義を追加
  for (const edge of result.edges) {
    lines.push(formatEdge(edge));
  }

  return lines.join('\n');
};

/**
 * ノードをMermaid記法に変換
 */
export const formatNode = (node: Node): string => {
  let shape = '';
  switch (node.shape) {
    case 'square':
      shape = '[%]';
      break;
    case 'round':
      shape = '(%)';
      break;
    case 'stadium':
      shape = '([%])';
      break;
    case 'subroutine':
      shape = '[[%]]';
      break;
    case 'cylindrical':
      shape = '[(%)]';
      break;
    case 'circle':
      shape = '((%))';
      break;
    case 'asymmetric':
      shape = '>[%]';
      break;
    case 'rhombus':
      shape = '{%}';
      break;
    case 'hexagon':
      shape = '{{%}}';
      break;
    case 'parallelogram':
      shape = '[/%/]';
      break;
    case 'parallelogram-alt':
      shape = '[\\%\\]';
      break;
    case 'trapezoid':
      shape = '[/%\\]';
      break;
    case 'trapezoid-alt':
      shape = '[\\%/]';
      break;
    case 'double-circle':
      shape = '(((%)))';
      break;
    default:
      shape = '[%]';
  }

  // スタイルの適用
  let style = '';
  if (node.style) {
    const styles: string[] = [];
    if (node.style.fill) styles.push(`fill:${node.style.fill}`);
    if (node.style.stroke) styles.push(`stroke:${node.style.stroke}`);
    if (node.style.strokeWidth)
      styles.push(`stroke-width:${node.style.strokeWidth}`);
    if (node.style.fontColor) styles.push(`color:${node.style.fontColor}`);

    if (styles.length > 0) {
      style = `:::${styles.join(',')}`;
    }
  }

  const nodeText = shape.replace('%', node.label);
  return `${node.id}${nodeText}${style}`;
};

/**
 * エッジをMermaid記法に変換
 */
export const formatEdge = (edge: Edge): string => {
  let connector = '-->';
  switch (edge.lineType) {
    case 'dotted':
      connector = '-..->';
      break;
    case 'thick':
      connector = '==>';
      break;
  }

  // スタイルの適用
  let style = '';
  if (edge.style) {
    const styles: string[] = [];
    if (edge.style.lineColor) styles.push(`stroke:${edge.style.lineColor}`);
    if (edge.style.textColor) styles.push(`color:${edge.style.textColor}`);
    if (edge.style.lineWidth)
      styles.push(`stroke-width:${edge.style.lineWidth}`);

    if (styles.length > 0) {
      style = `:::${styles.join(',')}`;
    }
  }

  const label = edge.label ? ` |${edge.label}|` : '';
  return `${edge.from}${connector}${label} ${edge.to}${style}`;
};

/**
 * パース結果をJSON文字列に変換
 */
export const toJson = (result: ParseResult): string => {
  return JSON.stringify(result, null, 2);
};

/**
 * パース結果を簡潔なテキスト形式に変換
 */
export const toText = (result: ParseResult): string => {
  const lines: string[] = [];

  if (result.title) {
    lines.push(`Title: ${result.title}`);
    lines.push('');
  }

  lines.push('Nodes:');
  for (const node of result.nodes) {
    lines.push(`- ${node.id}: ${node.label}`);
  }

  lines.push('');
  lines.push('Edges:');
  for (const edge of result.edges) {
    const label = edge.label ? ` (${edge.label})` : '';
    lines.push(`- ${edge.from} -> ${edge.to}${label}`);
  }

  return lines.join('\n');
};
