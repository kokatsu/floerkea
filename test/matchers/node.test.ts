import { describe, expect, test } from 'bun:test';
import { NodeMatcher } from '../../src/matchers/node';
import type { NodeShape } from '../../src/types/node';
import { ErrorCodes } from '../../src/utils/errors';

describe('NodeMatcher', () => {
  const matcher = new NodeMatcher();

  describe('match', () => {
    test.each([
      ['[Process]', 'square', 'Process'],
      ['(Process)', 'round', 'Process'],
      ['([Process])', 'stadium', 'Process'],
      ['[[Process]]', 'subroutine', 'Process'],
      ['[(Process)]', 'cylindrical', 'Process'],
      ['((Process))', 'circle', 'Process'],
      ['>Process]', 'asymmetric', 'Process'],
      ['{Process}', 'rhombus', 'Process'],
      ['{{Process}}', 'hexagon', 'Process'],
      ['[/Process/]', 'parallelogram', 'Process'],
      ['[\\Process\\]', 'parallelogram-alt', 'Process'],
      ['[/Process\\]', 'trapezoid', 'Process'],
      ['[\\Process/]', 'trapezoid-alt', 'Process'],
      ['(((Process)))', 'double-circle', 'Process'],
    ])(
      '"%s" should be parsed as %s shape',
      (input, expectedShape, expectedLabel) => {
        const result = matcher.match(input);

        expect(result.matched).toBe(true);
        expect(result.result?.shape).toBe(expectedShape as NodeShape);
        expect(result.result?.label).toBe(expectedLabel);
        expect(result.result?.original).toBe(input);
      },
    );

    test('空白を含むラベルを正しくパースできる', () => {
      const result = matcher.match('[Process Step 1]');

      expect(result.matched).toBe(true);
      expect(result.result?.shape).toBe('square');
      expect(result.result?.label).toBe('Process Step 1');
    });

    test('特殊文字を含むラベルを正しくパースできる', () => {
      const result = matcher.match('[Process-123_@#$]');

      expect(result.matched).toBe(true);
      expect(result.result?.shape).toBe('square');
      expect(result.result?.label).toBe('Process-123_@#$');
    });

    test('無効なノード形状でエラーを返す', () => {
      const result = matcher.match('invalid');

      expect(result.matched).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_SYNTAX);
    });

    test('空の入力でエラーを返す', () => {
      const result = matcher.match('');

      expect(result.matched).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.INVALID_SYNTAX);
    });
  });

  describe('format', () => {
    test.each([
      ['square', 'Process', '[Process]'],
      ['round', 'Process', '(Process)'],
      ['stadium', 'Process', '([Process])'],
      ['subroutine', 'Process', '[[Process]]'],
      ['cylindrical', 'Process', '[(Process)]'],
      ['circle', 'Process', '((Process))'],
      ['asymmetric', 'Process', '>Process]'],
      ['rhombus', 'Process', '{Process}'],
      ['hexagon', 'Process', '{{Process}}'],
      ['parallelogram', 'Process', '[/Process/]'],
      ['parallelogram-alt', 'Process', '[\\Process\\]'],
      ['trapezoid', 'Process', '[/Process\\]'],
      ['trapezoid-alt', 'Process', '[\\Process/]'],
      ['double-circle', 'Process', '(((Process)))'],
    ])('%s shape should be formatted correctly', (shape, label, expected) => {
      const result = matcher.format(shape as NodeShape, label);
      expect(result).toBe(expected);
    });

    test('未知の形状はデフォルトで四角形になる', () => {
      const result = matcher.format('unknown' as NodeShape, 'Process');
      expect(result).toBe('[Process]');
    });

    test('空のラベルを正しく処理できる', () => {
      const result = matcher.format('square', '');
      expect(result).toBe('[]');
    });
  });
});
