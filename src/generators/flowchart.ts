import type { FlowchartNode, FlowchartNodeType } from '../types/flowchart';
import type { Node } from '../types/node';
import type { Edge, ParseResult } from '../types/parser';
import type { Priority, TestCase } from '../types/testcase';

/**
 * フローチャート用テストケースジェネレーターのオプション
 */
interface FlowchartTestCaseGeneratorOptions {
  /**
   * テストケースIDのプレフィックス
   */
  idPrefix?: string;

  /**
   * 優先度の判定ルール
   * キーワードに基づいて優先度を決定
   */
  priorityRules?: {
    Critical: string[];
    High: string[];
    Medium: string[];
    Low: string[];
  };
}

const DEFAULT_FLOWCHART_PRIORITY_RULES = {
  Critical: ['認証', 'ログイン', 'セキュリティ', 'データベース', '決済'],
  High: ['登録', '更新', '削除', 'アップロード'],
  Medium: ['表示', '検索', '一覧'],
  Low: ['設定', 'ヘルプ', '通知'],
};

/**
 * フローチャートからテストケースを生成するジェネレーター
 */
export class FlowchartTestCaseGenerator {
  private options: Required<FlowchartTestCaseGeneratorOptions>;
  private currentEdges: Edge[] = [];
  private nodeTypeMap: Map<string, FlowchartNodeType> = new Map();

  constructor(options?: FlowchartTestCaseGeneratorOptions) {
    this.options = {
      idPrefix: 'FLOW',
      priorityRules: DEFAULT_FLOWCHART_PRIORITY_RULES,
      ...options,
    };
  }

  /**
   * ノードが開始ノードかどうかを判定
   */
  private isStartNode(node: Node): boolean {
    return (
      (node as FlowchartNode).nodeType === 'start' ||
      node.label.toLowerCase().includes('開始') ||
      node.label.toLowerCase().includes('start') ||
      (node.shape === 'circle' && this.isFirstNode(node.id))
    );
  }

  /**
   * ノードが最初のノード（入次数が0）かどうかを判定
   */
  private isFirstNode(nodeId: string): boolean {
    return !this.currentEdges.some((edge) => edge.to === nodeId);
  }

  /**
   * ノードが最後のノード（出次数が0）かどうかを判定
   */
  private isLastNode(nodeId: string): boolean {
    return !this.currentEdges.some((edge) => edge.from === nodeId);
  }

  /**
   * ノードが終了ノードかどうかを判定
   */
  private isEndNode(node: Node): boolean {
    return (
      (node as FlowchartNode).nodeType === 'end' ||
      node.label.toLowerCase().includes('終了') ||
      node.label.toLowerCase().includes('完了') ||
      node.label.toLowerCase().includes('end') ||
      (node.shape === 'circle' && this.isLastNode(node.id))
    );
  }

  /**
   * フロー内の次のノードを取得
   */
  private findNextFlowNodes(edges: Edge[], node: Node): Node[] {
    return edges
      .filter((edge) => edge.from === node.id)
      .map((edge) => ({ id: edge.to, label: edge.label || '' }) as Node);
  }

  /**
   * フローチャートの解析結果からテストケースを生成
   */
  // generateFlowchartTestCases(flowchart: ParseResult): TestCase[] {
  //   this.currentEdges = flowchart.edges;
  //   const testCases: TestCase[] = [];

  //   // 開始ノードを探索
  //   const startNodes = flowchart.nodes.filter((node) => this.isStartNode(node));

  //   if (startNodes.length === 0) {
  //     // 開始ノードが見つからない場合は入次数0のノードを開始ノードとして扱う
  //     const entryNodes = flowchart.nodes.filter((node) =>
  //       this.isFirstNode(node.id),
  //     );
  //     if (entryNodes.length > 0) {
  //       for (const entryNode of entryNodes) {
  //         const paths = this.findAllFlowPaths(flowchart, entryNode);
  //         for (const path of paths) {
  //           testCases.push(
  //             this.createFlowTestCase(
  //               path,
  //               flowchart.edges,
  //               testCases.length + 1,
  //             ),
  //           );
  //         }
  //       }
  //     }
  //   } else {
  //     // 開始ノードからのパスを探索
  //     for (const startNode of startNodes) {
  //       const paths = this.findAllFlowPaths(flowchart, startNode);
  //       for (const path of paths) {
  //         testCases.push(
  //           this.createFlowTestCase(
  //             path,
  //             flowchart.edges,
  //             testCases.length + 1,
  //           ),
  //         );
  //       }
  //     }
  //   }

  //   return testCases;
  // }

  /**
   * 指定ノードから到達可能な全フローパスを探索
   */
  private findAllFlowPaths(
    flowchart: ParseResult,
    start: Node,
    maxCycles = 1,
  ): Node[][] {
    const paths: Node[][] = [];
    const visited = new Map<string, number>(); // ノードの訪問回数を記録

    const dfs = (current: Node, path: Node[]) => {
      path.push(current);
      const currentVisits = visited.get(current.id) || 0;
      visited.set(current.id, currentVisits + 1);

      // 終了条件の判定
      const isTerminal = this.isEndNode(current) || this.isLastNode(current.id);
      const maxVisitsReached = (visited.get(current.id) || 0) > maxCycles;

      if (isTerminal || maxVisitsReached) {
        // パスが妥当な場合のみ記録（開始から終了まで）
        if (isTerminal) {
          paths.push([...path]);
        }
      } else {
        // 次のノードを探索
        const nextNodes = this.findNextFlowNodes(flowchart.edges, current);
        for (const next of nextNodes) {
          // 循環検出のための条件を緩和
          if ((visited.get(next.id) || 0) <= maxCycles) {
            dfs(next, path);
          }
        }
      }

      path.pop();
      visited.set(current.id, (visited.get(current.id) || 1) - 1);
    };

    dfs(start, []);
    return paths;
  }

  /**
   * 循環参照を含むパスかどうかを判定
   */
  private isCircularPath(path: Node[]): boolean {
    const nodeIds = new Set<string>();
    for (const node of path) {
      if (nodeIds.has(node.id)) {
        return true;
      }
      nodeIds.add(node.id);
    }
    return false;
  }

  /**
   * パスの探索
   */
  private findAllPaths(flowchart: ParseResult, start: Node): Node[][] {
    const paths: Node[][] = [];
    const visited = new Map<string, number>();
    const maxVisits = 2; // 循環パスの最大訪問回数

    const dfs = (current: Node, path: Node[]): void => {
      path.push(current);
      const visits = (visited.get(current.id) || 0) + 1;
      visited.set(current.id, visits);

      // 終了条件の判定
      const isTerminal = this.isEndNode(current) || this.isLastNode(current.id);

      if (isTerminal) {
        // パスが有効な場合のみ追加
        if (path.length > 1) {
          paths.push([...path]);
        }
      } else if (visits <= maxVisits) {
        // 次のノードを探索
        const nextNodes = this.getNextNodes(flowchart, current);
        for (const next of nextNodes) {
          const nextVisits = visited.get(next.id) || 0;
          if (nextVisits < maxVisits) {
            dfs(next, path);
          }
        }
      }

      path.pop();
      visited.set(current.id, visits - 1);
    };

    dfs(start, []);

    // 循環参照パスと非循環参照パスを分離して結合
    const normalPaths = paths.filter((path) => !this.isCircularPath(path));
    const circularPaths = paths.filter((path) => this.isCircularPath(path));

    // パスの長さでソート（短いパスから順に）
    const sortedPaths = [...normalPaths, ...circularPaths].sort(
      (a, b) => a.length - b.length,
    );

    return sortedPaths;
  }

  /**
   * 開始ノードを探索
   */
  private findStartNodes(nodes: Node[]): Node[] {
    return nodes.filter((node) => this.isStartNode(node));
  }

  /**
   * 次のノードを取得
   */
  private getNextNodes(flowchart: ParseResult, current: Node): Node[] {
    return this.currentEdges
      .filter((edge) => edge.from === current.id)
      .map((edge) => flowchart.nodes.find((node) => node.id === edge.to))
      .filter((node): node is Node => node !== undefined);
  }

  /**
   * フローチャートの解析結果からテストケースを生成
   */
  async generateFlowchartTestCases(
    flowchart: ParseResult,
  ): Promise<TestCase[]> {
    this.currentEdges = flowchart.edges;

    const testCases: TestCase[] = [];
    const startNodes = this.findStartNodes(flowchart.nodes);

    if (startNodes.length === 0) {
      // 開始ノードが見つからない場合は入次数0のノードを使用
      const entryNodes = flowchart.nodes.filter((node) =>
        this.isFirstNode(node.id),
      );
      if (entryNodes.length > 0) {
        for (const startNode of entryNodes) {
          const paths = this.findAllPaths(flowchart, startNode);
          for (const path of paths) {
            testCases.push(
              this.createFlowTestCase(
                path,
                flowchart.edges,
                testCases.length + 1,
              ),
            );
          }
        }
      }
    } else {
      for (const startNode of startNodes) {
        const paths = this.findAllPaths(flowchart, startNode);
        for (const path of paths) {
          testCases.push(
            this.createFlowTestCase(
              path,
              flowchart.edges,
              testCases.length + 1,
            ),
          );
        }
      }
    }

    return testCases;
  }

  /**
   * フローパスからテストケースを生成
   */
  private createFlowTestCase(
    path: Node[],
    edges: Edge[],
    index: number,
  ): TestCase {
    const id = `${this.options.idPrefix}-${String(index).padStart(3, '0')}`;
    const pathDescription = path.map((node) => node.label).join(' → ');

    // エラーパスの判定を改善
    const isErrorPath = this.isErrorPath(path, edges);

    const title = this.generateFlowTitle(path);
    const priority = this.determineFlowPriority(path);
    const preconditions = this.generateFlowPreconditions(path[0]);
    const steps = this.generateFlowSteps(path, edges);
    const expectedResults = this.generateFlowExpectedResults(path, isErrorPath);

    return {
      id,
      title,
      priority,
      description: `フローパス: ${pathDescription}`,
      preconditions,
      steps,
      expectedResults,
    };
  }

  /**
   * エラーパスかどうかを判定
   */
  private isErrorPath(path: Node[], edges: Edge[]): boolean {
    for (let i = 0; i < path.length - 1; i++) {
      const currentNode = path[i];
      const nextNode = path[i + 1];

      // エッジのラベルを確認
      const edge = edges.find(
        (e) => e.from === currentNode.id && e.to === nextNode.id,
      );
      if (
        edge?.label?.toLowerCase().includes('no') ||
        edge?.label?.toLowerCase().includes('ng')
      ) {
        return true;
      }

      // エラー関連のノードを確認
      if (nextNode.label.toLowerCase().includes('エラー')) {
        return true;
      }
    }

    return false;
  }

  /**
   * フローのテストケースタイトルを生成
   */
  private generateFlowTitle(path: Node[]): string {
    const start = path[0].label;
    const end = path[path.length - 1].label;
    return `${start}から${end}までのフロー検証`;
  }

  /**
   * フローの内容から優先度を判定
   */
  private determineFlowPriority(path: Node[]): Priority {
    // 各ノードのラベルをチェック
    for (const node of path) {
      const label = node.label.toLowerCase();

      // 優先度ルールに従って判定
      for (const [priority, keywords] of Object.entries(
        this.options.priorityRules,
      )) {
        if (keywords.some((keyword) => label.includes(keyword.toLowerCase()))) {
          return priority as Priority;
        }
      }
    }

    return 'Medium'; // デフォルトの優先度
  }

  /**
   * フローの前提条件を生成
   */
  private generateFlowPreconditions(startNode: Node): string[] {
    const preconditions = [
      'システムが正常に起動していること',
      'フローの開始条件が満たされていること',
    ];

    // 開始ノードに基づいて前提条件を追加
    const label = startNode.label.toLowerCase();
    if (label.includes('ログイン')) {
      preconditions.push('ユーザーアカウントが作成済みであること');
      preconditions.push('ログイン画面にアクセスできること');
    } else if (label.includes('登録')) {
      preconditions.push('登録に必要な情報が準備されていること');
    }

    return preconditions;
  }

  /**
   * フローのテスト手順を生成
   */
  private generateFlowSteps(path: Node[], edges: Edge[]): string[] {
    const steps: string[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const current = path[i];
      const next = path[i + 1];

      // 現在のノードに基づく操作手順
      steps.push(this.generateFlowStepDescription(current));

      // エッジのラベルがある場合は条件として追加
      const edge = edges.find((e) => e.from === current.id && e.to === next.id);
      if (edge?.label) {
        steps.push(`分岐条件「${edge.label}」に該当する操作を行う`);
      }
    }

    // 最後のノードの操作を追加
    steps.push(this.generateFlowStepDescription(path[path.length - 1]));

    return steps;
  }

  /**
   * フローチャートのノード種類に応じたステップの説明を生成
   */
  private generateFlowStepDescription(node: Node): string {
    const type = (node as FlowchartNode).nodeType as FlowchartNodeType;
    const label = node.label;

    switch (type) {
      case 'input':
        return `入力処理：「${label}」に必要な情報を入力する`;
      case 'process':
        return `処理実行：「${label}」の処理を実行する`;
      case 'decision':
        return `判定処理：「${label}」の条件を確認する`;
      case 'output':
        return `出力確認：「${label}」の出力を確認する`;
      case 'subroutine':
        return `サブルーチン：「${label}」のサブルーチンを実行する`;
      case 'database':
        return `データベース処理：「${label}」のデータ操作を実行する`;
      case 'start':
        return `開始処理：「${label}」からフローを開始する`;
      case 'end':
        return `終了処理：「${label}」でフローを終了する`;
      default:
        return `実行：「${label}」を実行する`;
    }
  }

  /**
   * フローの期待結果を生成
   */
  private generateFlowExpectedResults(
    path: Node[],
    isErrorPath: boolean,
  ): string[] {
    const expectedResults: string[] = [];
    const endNode = path[path.length - 1];
    const nodeType = (endNode as FlowchartNode).nodeType;

    if (isErrorPath) {
      expectedResults.push('適切なエラーメッセージが表示されること');
      expectedResults.push('エラー発生時の状態が適切に処理されること');

      if (path.some((node) => node.label.toLowerCase().includes('入力'))) {
        expectedResults.push('再入力が可能な状態であること');
      }
    } else {
      switch (nodeType) {
        case 'output':
          expectedResults.push(`「${endNode.label}」が正しく表示されること`);
          expectedResults.push('表示内容が仕様通りであること');
          break;
        case 'database':
          expectedResults.push(
            `「${endNode.label}」のデータ操作が正常に完了すること`,
          );
          expectedResults.push('データの整合性が保たれていること');
          break;
        case 'end':
          expectedResults.push(
            `フローが正常に完了し、「${endNode.label}」の状態となること`,
          );
          break;
        default:
          expectedResults.push(
            `「${endNode.label}」の処理が正常に完了すること`,
          );
      }

      // 処理の結果確認
      if (
        nodeType === 'output' ||
        path.some((node) => (node as FlowchartNode).nodeType === 'output')
      ) {
        expectedResults.push('画面の表示が適切に更新されること');
      }
    }

    return expectedResults;
  }
}
