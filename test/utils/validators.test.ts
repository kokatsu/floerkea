import { describe, expect, test } from 'bun:test';
import type { Edge } from '../../src/types/edge';
import type { Node } from '../../src/types/node';
import { ErrorCodes, ParseError } from '../../src/utils/errors';
import {
  validateColor,
  validateDirection,
  validateEdgeLineType,
  validateNodeId,
  validateNodeReferences,
  validateNodeShape,
} from '../../src/utils/validators';

describe('Validators', () => {
  describe('validateNodeId', () => {
    test('有効なノードIDを受け入れる', () => {
      expect(() => validateNodeId('Node1', 1, 1)).not.toThrow();
      expect(() => validateNodeId('node_1', 1, 1)).not.toThrow();
      expect(() => validateNodeId('node-1', 1, 1)).not.toThrow();
    });

    test('無効なノードIDでエラーを投げる', () => {
      expect(() => validateNodeId('Node 1', 1, 1)).toThrow(ParseError);
      expect(() => validateNodeId('node#1', 1, 1)).toThrow(ParseError);
    });
  });

  describe('validateNodeShape', () => {
    test('有効なノード形状を受け入れる', () => {
      expect(validateNodeShape('square', 1, 1)).toBe('square');
      expect(validateNodeShape('circle', 1, 1)).toBe('circle');
    });

    test('無効なノード形状でエラーを投げる', () => {
      expect(() => validateNodeShape('triangle', 1, 1)).toThrow(ParseError);
    });
  });

  // validateEdgeLineType のテストを追加
  describe('validateEdgeLineType', () => {
    test('有効なエッジ線種を受け入れる', () => {
      expect(validateEdgeLineType('solid', 1, 1)).toBe('solid');
      expect(validateEdgeLineType('dotted', 1, 1)).toBe('dotted');
      expect(validateEdgeLineType('thick', 1, 1)).toBe('thick');
    });

    test('無効なエッジ線種でエラーを投げる', () => {
      expect(() => validateEdgeLineType('invalid', 1, 1)).toThrow(ParseError);
    });
  });

  describe('validateNodeReferences', () => {
    test('有効なエッジを受け入れる', () => {
      const nodes: Node[] = [
        { id: 'A', label: 'Node A' },
        { id: 'B', label: 'Node B' },
        { id: 'C', label: 'Node C' },
      ];
      const edges: Edge[] = [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
      ];
      expect(() => validateNodeReferences(nodes, edges)).not.toThrow();
    });

    test('存在しないノードを参照するエッジでエラーを投げる', () => {
      const nodes: Node[] = [
        { id: 'A', label: 'Node A' },
        { id: 'B', label: 'Node B' },
      ];
      const edges1: Edge[] = [{ from: 'C', to: 'B' }];
      expect(() => validateNodeReferences(nodes, edges1)).toThrow(ParseError);

      const edges2: Edge[] = [{ from: 'A', to: 'C' }];
      expect(() => validateNodeReferences(nodes, edges2)).toThrow(ParseError);
    });
  });

  describe('validateDirection', () => {
    test('有効な方向を受け入れる', () => {
      expect(validateDirection('TB', 1, 1)).toBe('TB');
      expect(validateDirection('TD', 1, 1)).toBe('TD');
      expect(validateDirection('BT', 1, 1)).toBe('BT');
      expect(validateDirection('LR', 1, 1)).toBe('LR');
      expect(validateDirection('RL', 1, 1)).toBe('RL');
    });

    test('無効な方向でエラーを投げる', () => {
      expect(() => validateDirection('XX', 1, 1)).toThrow(ParseError);
    });
  });

  describe('validateColor', () => {
    test('有効な色を受け入れる', () => {
      expect(validateColor('#fff', 1, 1)).toBe('#fff');
      expect(validateColor('#ff0000', 1, 1)).toBe('#ff0000');
      expect(validateColor('red', 1, 1)).toBe('red');
    });

    test('無効な色でエラーを投げる', () => {
      expect(() => validateColor('#xyz', 1, 1)).toThrow(ParseError);
      expect(() => validateColor('invalid-color', 1, 1)).toThrow(ParseError);
    });

    test('エラーメッセージが正しい', () => {
      const line = 1;
      const column = 1;
      const invalidColor = 'invalid-color';

      try {
        validateColor(invalidColor, line, column);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(ParseError);
        expect(error?.toString()).toBe(
          `ERROR ${ErrorCodes.INVALID_STYLE}: Invalid color value: ${invalidColor}. Use hex color code or CSS color name. at line ${line}, column ${column}`,
        );
      }
    });
  });
});
