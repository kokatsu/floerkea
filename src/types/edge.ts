/**
 * エッジの線種を表す型
 */
export type EdgeLineType =
  | 'solid' // 実線 -->
  | 'dotted' // 点線 --->
  | 'thick'; // 太線 ==>

/**
 * エッジのスタイル定義
 */
export type EdgeStyle = {
  lineColor?: string; // 線の色
  textColor?: string; // ラベルの色
  lineWidth?: number; // 線の太さ
  fontSize?: number; // ラベルのフォントサイズ
};

/**
 * エッジの定義
 */
export type Edge = {
  from: string; // 開始ノードのID
  to: string; // 終了ノードのID
  label?: string; // エッジのラベル
  lineType?: EdgeLineType; // 線の種類
  style?: EdgeStyle; // スタイル定義
  meta?: Record<string, unknown>; // メタデータ
};
