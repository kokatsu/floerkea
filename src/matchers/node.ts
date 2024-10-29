import type { NodeShape } from '../types/node';
import { ErrorCodes, ParseError } from '../utils/errors';

/**
 * ノード形状のマッチング結果
 */
export type NodeMatchResult = {
  shape: NodeShape;
  label: string;
  original: string;
};

export type MatcherResult = {
  matched: boolean;
  result?: NodeMatchResult;
  error?: ParseError;
};

/**
 * ノードの形状を判定するマッチャー
 */
export class NodeMatcher {
  private matchers: Array<{
    shape: NodeShape;
    pattern: RegExp;
    extract: (match: RegExpMatchArray) => string;
  }> = [
    {
      shape: 'subroutine',
      pattern: /^\[\[([^\]]*)\]\]$/,
      extract: (match) => match[1],
    },
    {
      shape: 'cylindrical',
      pattern: /^\[\(([^)]*)\)\]$/,
      extract: (match) => match[1],
    },
    {
      shape: 'parallelogram',
      pattern: /^\[\/([^/]*)\/\]$/,
      extract: (match) => match[1],
    },
    {
      shape: 'parallelogram-alt',
      pattern: /^\[\\([^\\]*)\\]$/,
      extract: (match) => match[1],
    },
    {
      shape: 'trapezoid',
      pattern: /^\[\/([^\\]*)\\]$/,
      extract: (match) => match[1],
    },
    {
      shape: 'trapezoid-alt',
      pattern: /^\[\\([^/]*)\/\]$/,
      extract: (match) => match[1],
    },
    {
      shape: 'square',
      pattern: /^\[([^\]]*)\]$/,
      extract: (match) => match[1],
    },
    {
      shape: 'double-circle',
      pattern: /^\(\(\(([^)]*)\)\)\)$/,
      extract: (match) => match[1],
    },
    {
      shape: 'circle',
      pattern: /^\(\(([^)]*)\)\)$/,
      extract: (match) => match[1],
    },
    {
      shape: 'stadium',
      pattern: /^\(\[([^\]]*)\]\)$/,
      extract: (match) => match[1],
    },
    {
      shape: 'round',
      pattern: /^\(([^)]*)\)$/,
      extract: (match) => match[1],
    },
    {
      shape: 'asymmetric',
      pattern: /^>([^\]]*)\]$/,
      extract: (match) => match[1],
    },
    {
      shape: 'hexagon',
      pattern: /^\{\{([^}]*)\}\}$/,
      extract: (match) => match[1],
    },
    {
      shape: 'rhombus',
      pattern: /^\{([^}]*)\}$/,
      extract: (match) => match[1],
    },
  ];

  /**
   * 文字列がノード定義かどうかを判定
   */
  match(text: string, line = 1, column = 1): MatcherResult {
    const trimmed = text.trim();

    for (const matcher of this.matchers) {
      const match = trimmed.match(matcher.pattern);
      if (match) {
        return {
          matched: true,
          result: {
            shape: matcher.shape,
            label: matcher.extract(match),
            original: trimmed,
          },
        };
      }
    }

    return {
      matched: false,
      error: new ParseError(
        line,
        column,
        ErrorCodes.INVALID_SYNTAX,
        `Invalid node shape: ${text}`,
      ),
    };
  }

  /**
   * 形状に応じたMermaid記法の文字列を生成
   */
  format(shape: NodeShape, label: string): string {
    switch (shape) {
      case 'square':
        return `[${label}]`;
      case 'round':
        return `(${label})`;
      case 'stadium':
        return `([${label}])`;
      case 'subroutine':
        return `[[${label}]]`;
      case 'cylindrical':
        return `[(${label})]`;
      case 'circle':
        return `((${label}))`;
      case 'asymmetric':
        return `>${label}]`;
      case 'rhombus':
        return `{${label}}`;
      case 'hexagon':
        return `{{${label}}}`;
      case 'parallelogram':
        return `[/${label}/]`;
      case 'parallelogram-alt':
        return `[\\${label}\\]`;
      case 'trapezoid':
        return `[/${label}\\]`;
      case 'trapezoid-alt':
        return `[\\${label}/]`;
      case 'double-circle':
        return `(((${label})))`;
      default:
        return `[${label}]`; // デフォルトは四角形
    }
  }
}
