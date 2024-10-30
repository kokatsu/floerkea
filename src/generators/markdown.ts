import type { TestCase } from '../types/testcase';

export interface MarkdownGeneratorOptions {
  /**
   * テストケース間の区切り文字
   * デフォルト: '---'
   */
  separator?: string;

  /**
   * 各テストケースにヘッダーを付けるかどうか
   * デフォルト: true
   */
  includeHeader?: boolean;

  /**
   * ファイルの先頭に追加するヘッダー
   */
  fileHeader?: string;
}

export class MarkdownTestCaseGenerator {
  private options: Required<MarkdownGeneratorOptions>;

  constructor(options?: MarkdownGeneratorOptions) {
    this.options = {
      separator: '---',
      includeHeader: true,
      fileHeader: '',
      ...options,
    };
  }

  /**
   * テストケースをMarkdown形式の文字列に変換
   */
  public formatTestCase(testCase: TestCase): string {
    const lines: string[] = [];

    // ヘッダー部分
    if (this.options.includeHeader) {
      lines.push(`# ${testCase.id}: ${testCase.title}`);
      lines.push('');
    }

    // 優先度
    lines.push(`**優先度**: ${testCase.priority}`);
    lines.push('');

    // 説明
    lines.push('## 説明');
    lines.push(testCase.description);
    lines.push('');

    // 前提条件
    lines.push('## 前提条件');
    for (const precondition of testCase.preconditions) {
      lines.push(`- ${precondition}`);
    }
    lines.push('');

    // テスト手順
    lines.push('## テスト手順');
    testCase.steps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step}`);
    });
    lines.push('');

    // 期待結果
    lines.push('## 期待結果');
    for (const result of testCase.expectedResults) {
      lines.push(`- ${result}`);
    }

    return lines.join('\n');
  }

  /**
   * 複数のテストケースをMarkdown形式の文字列に変換
   */
  public formatTestCases(testCases: TestCase[]): string {
    const lines: string[] = [];

    // ファイルヘッダーの追加
    if (this.options.fileHeader) {
      lines.push(this.options.fileHeader);
      lines.push('');
    }

    // 各テストケースを変換
    testCases.forEach((testCase, index) => {
      if (index > 0) {
        lines.push('');
        lines.push(this.options.separator);
        lines.push('');
      }
      lines.push(this.formatTestCase(testCase));
    });

    return lines.join('\n');
  }

  /**
   * テストケースをMarkdownファイルに保存
   */
  public async saveToFile(
    testCases: TestCase[],
    filePath: string,
  ): Promise<void> {
    try {
      // Markdownの生成と保存
      const markdown = this.formatTestCases(testCases);
      await Bun.write(filePath, markdown);
    } catch (error) {
      throw new Error(
        `Failed to save test cases to file: ${(error as Error).message}`,
      );
    }
  }
}
