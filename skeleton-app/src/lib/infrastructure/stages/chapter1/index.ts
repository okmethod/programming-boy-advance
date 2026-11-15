/**
 * チャプター1 のステージを束ねるバレル。
 */

import type { Stage } from "#lib/application";
import { STRAIGHT_CORRIDOR_STAGE } from "./straight-corridor";
import { L_CURVE_STAGE } from "./l-curve";
import { SWITCHBACK_STAGE } from "./switchback";
import { LONG_CORRIDOR_STAGE } from "./long-corridor";

export { STRAIGHT_CORRIDOR_STAGE } from "./straight-corridor";
export { L_CURVE_STAGE } from "./l-curve";
export { SWITCHBACK_STAGE } from "./switchback";
export { LONG_CORRIDOR_STAGE } from "./long-corridor";

/**
 * チャプター1 のステージ列（リストの並び順＝選択 UI での並び順）。
 * 将来のステージはここに足して並べる。
 */
export const CHAPTER1_STAGES: readonly Stage[] = [
  STRAIGHT_CORRIDOR_STAGE,
  L_CURVE_STAGE,
  SWITCHBACK_STAGE,
  LONG_CORRIDOR_STAGE,
];
