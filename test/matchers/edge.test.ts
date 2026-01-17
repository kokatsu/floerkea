import { describe, expect, test } from 'bun:test';
import { EdgeMatcher } from '../../src/matchers/edge';
import type { EdgeLineType } from '../../src/types/edge';
import type { NodeShape } from '../../src/types/node';
import { ErrorCodes } from '../../src/utils/errors';

describe('EdgeMatcher', () => {
  const matcher = new EdgeMatcher();

  describe('match', () => {
    test.each([
      ['A --> B', 'solid', undefined, 'A', 'B'],
      ['A -.-> B', 'dotted', undefined, 'A', 'B'],
      ['A ==> B', 'thick', undefined, 'A', 'B'],
      ['A -->|label| B', 'solid', 'label', 'A', 'B'],
      ['node_1 --> node_2', 'solid', undefined, 'node_1', 'node_2'],
    ])('基本的なエッジ "%s" をパースできる', (input, expectedType, expectedLabel, expectedFrom, expectedTo) => {
      const result = matcher.match(input);

      expect(result.matched).toBe(true);
      expect(result.result?.lineType).toBe(expectedType as EdgeLineType);
      expect(result.result?.label).toBe(expectedLabel as string);
      expect(result.result?.from.id).toBe(expectedFrom);
      expect(result.result?.to.id).toBe(expectedTo);
    });

    test('ノード形状を含むエッジ定義をパースできる', () => {
      const testCases = [
        {
          input: 'A[Process] --> B{Decision}',
          fromShape: 'square',
          fromLabel: 'Process',
          toShape: 'rhombus',
          toLabel: 'Decision',
        },
        {
          input: 'A((Start)) --> B[Process]',
          fromShape: 'circle',
          fromLabel: 'Start',
          toShape: 'square',
          toLabel: 'Process',
        },
      ];

      for (const {
        input,
        fromShape,
        fromLabel,
        toShape,
        toLabel,
      } of testCases) {
        const result = matcher.match(input);
        expect(result.matched).toBe(true);
        expect(result.result?.from.node?.shape).toBe(fromShape as NodeShape);
        expect(result.result?.from.node?.label).toBe(fromLabel);
        expect(result.result?.to.node?.shape).toBe(toShape as NodeShape);
        expect(result.result?.to.node?.label).toBe(toLabel);
      }
    });

    test('片方のノードのみ形状を持つエッジをパースできる', () => {
      const result = matcher.match('A[Process] --> B');

      expect(result.matched).toBe(true);
      expect(result.result?.from.node?.shape).toBe('square');
      expect(result.result?.from.node?.label).toBe('Process');
      expect(result.result?.to.node).toBeUndefined();
    });

    test('ラベル付きで形状を持つエッジをパースできる', () => {
      const result = matcher.match('A[Start] -->|Yes| B{Decision}');

      expect(result.matched).toBe(true);
      expect(result.result?.label).toBe('Yes');
      expect(result.result?.from.node?.shape).toBe('square');
      expect(result.result?.to.node?.shape).toBe('rhombus');
    });
  });

  describe('format', () => {
    test('基本的なエッジをフォーマットできる', () => {
      const from = { id: 'A' };
      const to = { id: 'B' };
      expect(matcher.format(from, to)).toBe('A --> B');
      expect(matcher.format(from, to, 'dotted')).toBe('A -.-> B');
      expect(matcher.format(from, to, 'thick')).toBe('A ==> B');
    });

    test('ラベル付きエッジをフォーマットできる', () => {
      const from = { id: 'A' };
      const to = { id: 'B' };
      expect(matcher.format(from, to, 'solid', 'label')).toBe('A -->|label| B');
    });

    test('ノード形状を含むエッジをフォーマットできる', () => {
      const from = {
        id: 'A',
        node: {
          shape: 'square' as const,
          label: 'Start',
          original: '[Start]',
        },
      };
      const to = {
        id: 'B',
        node: {
          shape: 'rhombus' as const,
          label: 'Decision',
          original: '{Decision}',
        },
      };

      expect(matcher.format(from, to)).toBe('[Start] --> {Decision}');
    });
  });

  describe('validate', () => {
    test('有効なエッジ定義を検証', () => {
      const validEdges = [
        'A --> B',
        'A[Process] --> B{Decision}',
        'A -->|label| B',
        'A((Start)) --> B[End]',
      ];

      for (const edge of validEdges) {
        const result = matcher.validate(edge);
        expect(result).toHaveLength(0);
      }
    });

    test('無効なエッジ定義でエラーを報告', () => {
      const invalidEdges = [
        '',
        'A',
        'A ->',
        'A --> ',
        '-> B',
        'A --- B',
        'A >>> B',
      ];

      for (const edge of invalidEdges) {
        const result = matcher.validate(edge);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].code).toBe(ErrorCodes.INVALID_SYNTAX);
      }
    });
  });
});
