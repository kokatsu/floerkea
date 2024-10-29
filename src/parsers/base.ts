import type { ParseResult, ParserOptions } from '../types/parser';
import { ParseError } from '../utils/errors';

/**
 * 基本パーサークラス
 * 他のパーサーの基底クラスとして使用
 */
export abstract class BaseParser {
  protected options: Required<ParserOptions>;
  protected currentLine = 0;
  protected currentColumn = 0;
  protected errors: ParseError[] = [];

  constructor(options?: ParserOptions) {
    this.options = {
      strictMode: true,
      defaultDirection: 'TD',
      validateConnections: true,
      allowUndefinedNodes: false,
      defaultNodeShape: 'square',
      defaultNodeStyle: {},
      defaultEdgeStyle: {},
      ...options,
    };
  }

  /**
   * 文字列をパースして結果を返す
   */
  abstract parse(content: string): Promise<ParseResult>;

  /**
   * 構文の検証のみを行う
   */
  abstract validate(content: string): Promise<ParseError[]>;

  /**
   * 位置情報を更新
   */
  protected updatePosition(line: number, column: number): void {
    this.currentLine = line;
    this.currentColumn = column;
  }

  /**
   * エラーを追加
   */
  protected addError(
    message: string,
    code: string,
    severity: 'error' | 'warning' = 'error',
  ): void {
    this.errors.push(
      new ParseError(
        this.currentLine,
        this.currentColumn,
        code,
        message,
        severity,
      ),
    );
  }

  /**
   * 行を前処理
   */
  protected preprocessLine(line: string): string {
    // コメントを除去した新しい文字列を作成
    const withoutComments = line.replace(/%%.+$/, '');
    // 先頭と末尾の空白を除去して返す
    return withoutComments.trim();
  }

  /**
   * 空行かどうかをチェック
   */
  protected isEmptyLine(line: string): boolean {
    return line.trim().length === 0;
  }
}
