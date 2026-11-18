/**
 * チャプター1（基本移動）のステージを束ねるバレル。
 */

import type { Stage } from "#lib/application";
import { STRAIGHT_CORRIDOR_STAGE } from "./straight-corridor";
import { L_CURVE_STAGE } from "./l-curve";
import { S_CURVE_STAGE } from "./s-curve";
import { LONG_CORRIDOR_STAGE } from "./long-corridor";
import { ZIGZAG_STAGE } from "./zigzag";
import { SWITCHBACK_STAGE } from "./switchback";
import { RING_STAGE } from "./ring";
import { SPIRAL_STAGE } from "./spiral";

export { STRAIGHT_CORRIDOR_STAGE } from "./straight-corridor";
export { L_CURVE_STAGE } from "./l-curve";
export { S_CURVE_STAGE } from "./s-curve";
export { LONG_CORRIDOR_STAGE } from "./long-corridor";
export { ZIGZAG_STAGE } from "./zigzag";
export { SWITCHBACK_STAGE } from "./switchback";
export { RING_STAGE } from "./ring";
export { SPIRAL_STAGE } from "./spiral";

/**
 * チャプター1 の学習曲線（リストの並び順＝選択 UI での並び順）:
 * 各種コマンドを順番に解放し、新要素を1つずつ足す。
 * - コマンドブロック（直進・向き変え）
 * - 制御ブロック（くりかえし）
 * - クエリブロック（壁センサ）
 */
export const CHAPTER1_STAGES: readonly Stage[] = [
  // 基本移動（くりかえし無し）
  STRAIGHT_CORRIDOR_STAGE, // 直進
  L_CURVE_STAGE, // 向き変え
  S_CURVE_STAGE, // 向き変え（その2）
  // 要くりかえし
  LONG_CORRIDOR_STAGE, // 直進のくりかえし
  ZIGZAG_STAGE, // 向き変えを含むくりかえし
  SWITCHBACK_STAGE, // 向き変えを含むくりかえし（その2）
  // 要センサ
  RING_STAGE, // 壁の前で曲がる
  SPIRAL_STAGE, // 壁の前で曲がる（その2）
];
