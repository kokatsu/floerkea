import { describe, expect, test } from 'bun:test';
import type { Edge, Node, ParseResult } from '../../src/types/parser';
import {
  formatEdge,
  formatNode,
  toJson,
  toMermaid,
  toText,
} from '../../src/utils/formatters';

describe('Formatters', () => {
  describe('toMermaid', () => {
    test('基本的なグラフを正しくフォーマットする', () => {
      const result: ParseResult = {
        direction: 'TD',
        nodes: [
          { id: 'A', label: 'Start' },
          { id: 'B', label: 'End' },
        ],
        edges: [{ from: 'A', to: 'B' }],
      };

      const expected = ['graph TD', 'A[Start]', 'B[End]', 'A--> B'].join('\n');

      expect(toMermaid(result)).toBe(expected);
    });

    test('スタイル付きのグラフを正しくフォーマットする', () => {
      const result: ParseResult = {
        direction: 'LR',
        nodes: [
          {
            id: 'A',
            label: 'Start',
            shape: 'circle',
            style: { fill: '#fff', stroke: '#000' },
          },
          {
            id: 'B',
            label: 'End',
            shape: 'rhombus',
            style: { fill: 'blue' },
          },
        ],
        edges: [
          {
            from: 'A',
            to: 'B',
            lineType: 'dotted',
            label: 'test',
            style: { lineColor: 'red' },
          },
        ],
      };

      const expected = [
        'graph LR',
        'A((Start)):::fill:#fff,stroke:#000',
        'B{End}:::fill:blue',
        'A-..->' + ' |test| B:::stroke:red',
      ].join('\n');

      expect(toMermaid(result)).toBe(expected);
    });
  });

  describe('toText', () => {
    test('基本的なグラフをテキスト形式に変換する', () => {
      const result: ParseResult = {
        title: 'Simple Graph',
        nodes: [
          { id: 'A', label: 'Start' },
          { id: 'B', label: 'End' },
        ],
        edges: [{ from: 'A', to: 'B', label: 'Process' }],
      };

      const expected = [
        'Title: Simple Graph',
        '',
        'Nodes:',
        '- A: Start',
        '- B: End',
        '',
        'Edges:',
        '- A -> B (Process)',
      ].join('\n');

      expect(toText(result)).toBe(expected);
    });
  });

  describe('formatNode', () => {
    test('異なる形状のノードを正しくフォーマットする', () => {
      const nodes: Node[] = [
        { id: 'A', label: 'Normal', shape: 'square' },
        { id: 'B', label: 'Round', shape: 'round' },
        { id: 'C', label: 'Stadium', shape: 'stadium' },
        { id: 'D', label: 'Subroutine', shape: 'subroutine' },
        { id: 'E', label: 'Cylindrical', shape: 'cylindrical' },
        { id: 'F', label: 'Circle', shape: 'circle' },
        { id: 'G', label: 'Asymmetric', shape: 'asymmetric' },
        { id: 'H', label: 'Diamond', shape: 'rhombus' },
        { id: 'I', label: 'Hexagon', shape: 'hexagon' },
        { id: 'J', label: 'Parallelogram', shape: 'parallelogram' },
        { id: 'K', label: 'Parallelogram Alt', shape: 'parallelogram-alt' },
        { id: 'L', label: 'Trapezoid', shape: 'trapezoid' },
        { id: 'M', label: 'Trapezoid Alt', shape: 'trapezoid-alt' },
        { id: 'N', label: 'Double Circle', shape: 'double-circle' },
      ];

      expect(formatNode(nodes[0])).toBe('A[Normal]');
      expect(formatNode(nodes[1])).toBe('B(Round)');
      expect(formatNode(nodes[2])).toBe('C([Stadium])');
      expect(formatNode(nodes[3])).toBe('D[[Subroutine]]');
      expect(formatNode(nodes[4])).toBe('E[(Cylindrical)]');
      expect(formatNode(nodes[5])).toBe('F((Circle))');
      expect(formatNode(nodes[6])).toBe('G>[Asymmetric]');
      expect(formatNode(nodes[7])).toBe('H{Diamond}');
      expect(formatNode(nodes[8])).toBe('I{{Hexagon}}');
      expect(formatNode(nodes[9])).toBe('J[/Parallelogram/]');
      expect(formatNode(nodes[10])).toBe('K[\\Parallelogram Alt\\]');
      expect(formatNode(nodes[11])).toBe('L[/Trapezoid\\]');
      expect(formatNode(nodes[12])).toBe('M[\\Trapezoid Alt/]');
      expect(formatNode(nodes[13])).toBe('N(((Double Circle)))');
    });

    test('スタイル付きのノードを正しくフォーマットする', () => {
      const node: Node = {
        id: 'A',
        label: 'Styled',
        style: {
          fill: '#fff',
          stroke: '#000',
          fontColor: 'blue',
        },
      };

      expect(formatNode(node)).toBe(
        'A[Styled]:::fill:#fff,stroke:#000,color:blue',
      );
    });
  });

  describe('formatEdge', () => {
    test('異なる線種のエッジを正しくフォーマットする', () => {
      const edges: Edge[] = [
        { from: 'A', to: 'B', lineType: 'solid' },
        { from: 'B', to: 'C', lineType: 'dotted' },
        { from: 'C', to: 'D', lineType: 'thick' },
      ];

      expect(formatEdge(edges[0])).toBe('A--> B');
      expect(formatEdge(edges[1])).toBe('B-..->' + ' C');
      expect(formatEdge(edges[2])).toBe('C==>' + ' D');
    });

    test('ラベルとスタイル付きのエッジを正しくフォーマットする', () => {
      const edge: Edge = {
        from: 'A',
        to: 'B',
        label: 'Test',
        style: {
          lineColor: 'red',
          textColor: 'blue',
        },
      };

      expect(formatEdge(edge)).toBe('A--> |Test| B:::stroke:red,color:blue');
    });
  });

  describe('toJson', () => {
    test('パース結果をJSON文字列に変換する', () => {
      const result: ParseResult = {
        title: 'Test',
        nodes: [{ id: 'A', label: 'Node A' }],
        edges: [{ from: 'A', to: 'B' }],
      };

      const expected = JSON.stringify(result, null, 2);

      expect(toJson(result)).toBe(expected);
    });
  });
});
