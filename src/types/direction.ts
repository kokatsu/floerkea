/**
 * グラフの方向を表す型
 * TB: Top to Bottom
 * TD: Top to Down (TBと同じ)
 * BT: Bottom to Top
 * LR: Left to Right
 * RL: Right to Left
 */
export type Direction = 'TB' | 'TD' | 'BT' | 'LR' | 'RL';

/**
 * 方向の変換関連のユーティリティ
 */
export const DirectionUtil = {
  /**
   * 有効な方向値かどうかを判定
   */
  isValid(value: string): value is Direction {
    return ['TB', 'TD', 'BT', 'LR', 'RL'].includes(value);
  },
} as const;
