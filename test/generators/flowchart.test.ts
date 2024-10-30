import { beforeEach, describe, expect, test } from 'bun:test';
import { FlowchartTestCaseGenerator } from '../../src/generators/flowchart';
import { FlowchartParser } from '../../src/parsers/flowchart';

describe('Flowchart Integration Test', () => {
  let parser: FlowchartParser;
  let generator: FlowchartTestCaseGenerator;

  beforeEach(() => {
    parser = new FlowchartParser();
    generator = new FlowchartTestCaseGenerator();
  });

  describe('ログインフローのテストケース生成', () => {
    test('基本的なログインフローからテストケースを生成できること', async () => {
      // Mermaid記法でのログインフロー定義
      const flowchartDefinition = `
        flowchart TD
          Start[ログイン開始] --> Input[ユーザー情報入力]
          Input --> Validate[認証処理]
          Validate --> Decision{認証成功？}
          Decision -->|Yes| Success[ダッシュボード表示]
          Decision -->|No| Error[エラーメッセージ表示]
          Success --> End[ログイン完了]
          Error --> Input
      `;

      // パースとテストケース生成
      const parseResult = await parser.parse(flowchartDefinition);
      const testCases = await generator.generateFlowchartTestCases(parseResult);

      // 基本的な検証
      expect(testCases.length).toBeGreaterThan(0);

      // 成功パスの検証
      const successPath = testCases.find(
        (tc) =>
          tc.steps.some((step) => step.includes('ダッシュボード')) &&
          !tc.steps.some((step) => step.includes('エラー')),
      );
      expect(successPath).toBeDefined();
      expect(successPath?.priority).toBe('Critical'); // ログイン処理は Critical
      expect(successPath?.steps).toEqual(
        expect.arrayContaining([
          expect.stringContaining('ログイン開始'),
          expect.stringContaining('ユーザー情報入力'),
          expect.stringContaining('認証処理'),
          expect.stringContaining('ダッシュボード表示'),
          expect.stringContaining('ログイン完了'),
        ]),
      );

      // エラーパスの検証
      const errorPath = testCases.find((tc) =>
        tc.steps.some((step) => step.includes('エラー')),
      );
      expect(errorPath).toBeDefined();
      expect(errorPath?.steps).toEqual(
        expect.arrayContaining([
          expect.stringContaining('エラーメッセージ表示'),
        ]),
      );
    });
  });

  describe('商品登録フローのテストケース生成', () => {
    test('商品登録フローからテストケースを生成できること', async () => {
      const flowchartDefinition = `
        flowchart TD
          Start[商品登録開始] --> Input[商品情報入力]
          Input --> Validate[入力内容検証]
          Validate --> Decision{バリデーション}
          Decision -->|OK| SaveDB[(データベース保存)]
          Decision -->|NG| Error[エラー表示]
          SaveDB --> CreateImage[商品画像生成]
          CreateImage --> Publish[商品公開]
          Publish --> End[登録完了]
          Error --> Input
      `;

      const parseResult = await parser.parse(flowchartDefinition);
      const testCases = await generator.generateFlowchartTestCases(parseResult);

      // 基本的な検証
      expect(testCases.length).toBeGreaterThan(0);

      // 正常パスの検証
      const successPath = testCases.find((tc) =>
        tc.steps.some((step) => step.includes('商品公開')),
      );
      expect(successPath).toBeDefined();
      expect(successPath?.priority).toBe('High'); // 登録処理は High
      expect(successPath?.steps).toEqual(
        expect.arrayContaining([
          expect.stringContaining('商品情報入力'),
          expect.stringContaining('入力内容検証'),
          expect.stringContaining('データベース保存'),
          expect.stringContaining('商品画像生成'),
          expect.stringContaining('商品公開'),
        ]),
      );
    });
  });

  describe('複雑な条件分岐を含むフローのテストケース生成', () => {
    test('複数の条件分岐を含むフローからテストケースを生成できること', async () => {
      const flowchartDefinition = `
        flowchart TD
          Start[支払い処理開始] --> Check{在庫確認}
          Check -->|あり| Payment{支払方法選択}
          Check -->|なし| OutOfStock[在庫切れ表示]
          Payment -->|クレジット| Credit[クレジット決済処理]
          Payment -->|代引き| COD[代引き処理]
          Payment -->|銀行振込| Bank[振込処理]
          Credit --> ValidateCard{カード認証}
          ValidateCard -->|OK| Process[決済処理]
          ValidateCard -->|NG| CardError[カードエラー表示]
          Process --> Complete[完了処理]
          COD --> Complete
          Bank --> Complete
          CardError --> Payment
          Complete --> End[処理完了]
          OutOfStock --> End
      `;

      const parseResult = await parser.parse(flowchartDefinition);
      const testCases = await generator.generateFlowchartTestCases(parseResult);

      // 基本的な検証
      expect(testCases.length).toBeGreaterThan(0);

      // クレジットカード決済パスの検証
      const creditPath = testCases.find((tc) =>
        tc.steps.some((step) => step.includes('クレジット決済')),
      );
      expect(creditPath).toBeDefined();
      expect(creditPath?.priority).toBe('Critical'); // 決済処理は Critical
      expect(creditPath?.steps).toEqual(
        expect.arrayContaining([
          expect.stringContaining('支払い処理開始'),
          expect.stringContaining('在庫確認'),
          expect.stringContaining('支払方法選択'),
          expect.stringContaining('クレジット決済処理'),
          expect.stringContaining('カード認証'),
          expect.stringContaining('決済処理'),
          expect.stringContaining('完了処理'),
        ]),
      );

      // 在庫切れパスの検証
      const outOfStockPath = testCases.find((tc) =>
        tc.steps.some((step) => step.includes('在庫切れ')),
      );
      expect(outOfStockPath).toBeDefined();
      expect(outOfStockPath?.steps).toEqual(
        expect.arrayContaining([
          expect.stringContaining('在庫確認'),
          expect.stringContaining('在庫切れ表示'),
        ]),
      );
    });
  });

  describe('エラー処理の検証', () => {
    test('不正なフローチャート定義でエラーがスローされること', async () => {
      const invalidFlowchart = `
        flowchart TD
          Start --> End
          InvalidNode -->
      `;

      await expect(parser.parse(invalidFlowchart)).rejects.toThrow();
    });

    test('不完全なフローチャート定義でエラーがスローされること', async () => {
      const incompleteFlowchart = `
        flowchart TD
          Start
      `;

      await expect(parser.parse(incompleteFlowchart)).rejects.toThrow();
    });
  });

  describe('特殊なケースの処理', () => {
    test('サブプロセスを含むフローからテストケースを生成できること', async () => {
      const subprocessFlowchart = `
        flowchart TD
          Start[開始] --> SubProcess[[サブ処理]]
          SubProcess --> Check{確認}
          Check -->|OK| End[完了]
          Check -->|NG| SubProcess
      `;

      const parseResult = await parser.parse(subprocessFlowchart);
      const testCases = await generator.generateFlowchartTestCases(parseResult);

      const subprocessCase = testCases.find((tc) =>
        tc.steps.some((step) => step.includes('サブ処理')),
      );
      expect(subprocessCase).toBeDefined();
      expect(subprocessCase?.steps).toEqual(
        expect.arrayContaining([expect.stringContaining('サブ処理')]),
      );
    });
  });

  describe('テストケースの詳細な検証', () => {
    test('生成されたテストケースが必要な情報を全て含んでいること', async () => {
      const simpleFlow = `
        flowchart TD
          Start[開始] --> Process[処理]
          Process --> End[完了]
      `;

      const parseResult = await parser.parse(simpleFlow);
      const testCases = await generator.generateFlowchartTestCases(parseResult);
      const testCase = testCases[0];

      // テストケースの構造検証
      expect(testCase).toHaveProperty('id');
      expect(testCase).toHaveProperty('title');
      expect(testCase).toHaveProperty('priority');
      expect(testCase).toHaveProperty('description');
      expect(testCase).toHaveProperty('preconditions');
      expect(testCase).toHaveProperty('steps');
      expect(testCase).toHaveProperty('expectedResults');

      // 配列プロパティの検証
      expect(Array.isArray(testCase.preconditions)).toBe(true);
      expect(Array.isArray(testCase.steps)).toBe(true);
      expect(Array.isArray(testCase.expectedResults)).toBe(true);

      // 必須項目の存在検証
      expect(testCase.preconditions.length).toBeGreaterThan(0);
      expect(testCase.steps.length).toBeGreaterThan(0);
      expect(testCase.expectedResults.length).toBeGreaterThan(0);
    });
  });
});
