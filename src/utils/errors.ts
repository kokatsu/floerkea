/**
 * パース処理中のエラーを表すカスタムエラークラス
 */
export class ParseError extends Error {
  constructor(
    public line: number,
    public column: number,
    public code: string,
    message: string,
    public severity: 'error' | 'warning' = 'error',
  ) {
    super(message);
    this.name = 'ParseError';
  }

  toString(): string {
    return `${this.severity.toUpperCase()} ${this.code}: ${this.message} at line ${this.line}, column ${this.column}`;
  }
}

export const ErrorCodes = {
  INVALID_SYNTAX: 'E001',
  UNDEFINED_NODE: 'E002',
  INVALID_EDGE: 'E003',
  INVALID_SHAPE: 'E004',
  INVALID_STYLE: 'E005',
  INVALID_DIRECTION: 'E006',
} as const;
