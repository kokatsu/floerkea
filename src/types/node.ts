/**
 * ノードの形状を表す型
 * デフォルトは四角形
 */
export type NodeShape =
  | 'square' // 四角形 [テキスト]
  | 'round' // 丸角 (テキスト)
  | 'stadium' // スタジアム ([テキスト])
  | 'subroutine' // サブルーチン [[テキスト]]
  | 'cylindrical' // 円柱 [(テキスト)]
  | 'circle' // 円形 ((テキスト))
  | 'asymmetric' // 非対称 >テキスト]
  | 'rhombus' // ひし形 {テキスト}
  | 'hexagon' // 六角形 {{テキスト}}
  | 'parallelogram' // 平行四辺形 [/テキスト/]
  | 'parallelogram-alt' // 平行四辺形 [\テキスト\]
  | 'trapezoid' // 台形 [/テキスト\]
  | 'trapezoid-alt' // 台形 [\テキスト/]
  | 'double-circle'; // 二重円形 (((テキスト)))

/**
 * ノードのスタイル定義
 */
export type NodeStyle = {
  fill?: string; // 塗りつぶし色
  stroke?: string; // 枠線の色
  strokeWidth?: number; // 枠線の太さ
  fontColor?: string; // フォントの色
};

/**
 * ノードの定義
 */
export type Node = {
  id: string; // ノードの一意識別子
  label: string; // 表示テキスト
  shape?: NodeShape; // ノードの形状
  style?: NodeStyle; // スタイル定義
  meta?: Record<string, unknown>; // メタデータ
};
