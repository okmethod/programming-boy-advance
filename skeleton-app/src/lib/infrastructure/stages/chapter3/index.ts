/**
 * チャプター3（攻撃・敵の動きへの対応）のステージを束ねるバレル。
 */

import type { Stage } from "#lib/application";
import { STILL_TARGET_STAGE } from "./still-target";
import { STANDING_SENTRY_STAGE } from "./standing-sentry";
import { APPROACHING_SENTRY_STAGE } from "./approaching-sentry";
import { PATROLLING_SENTRY_STAGE } from "./patrolling-sentry";
import { CIRCLING_SENTRY_STAGE } from "./circling-sentry";
import { NONSTOP_CIRCLING_SENTRY_STAGE } from "./nonstop-circling-sentry";
import { SWINGING_SENTRY_STAGE } from "./swinging-sentry";
import { MAZE_SENTRY_STAGE } from "./maze-sentry";

export { STILL_TARGET_STAGE } from "./still-target";
export { STANDING_SENTRY_STAGE } from "./standing-sentry";
export { APPROACHING_SENTRY_STAGE } from "./approaching-sentry";
export { PATROLLING_SENTRY_STAGE } from "./patrolling-sentry";
export { CIRCLING_SENTRY_STAGE } from "./circling-sentry";
export { NONSTOP_CIRCLING_SENTRY_STAGE } from "./nonstop-circling-sentry";
export { SWINGING_SENTRY_STAGE } from "./swinging-sentry";
export { MAZE_SENTRY_STAGE } from "./maze-sentry";

/**
 * チャプター3 の学習曲線（リストの並び順＝選択 UI での並び順）。全面カメ v5（攻撃＋敵センサ）にロック。
 * 敵は自壊せず、HP を攻撃で削り切って倒す。1面ごとに敵のふるまいを1つ足して、その動きへの対応を教える（迷路は総仕上げの最終面だけで使う）。
 * - 動かない的（攻撃の初出。反撃されない）
 * - 立ちはだかる見張り（攻撃される脅威の初出。HP の差で競り勝てる）
 * - 向かってくる見張り（待ち構えて先手を取る。自分から進むと1発差で競り負ける）
 * - 往復する見張り（正面からは競り負ける。見張りの死角＝横で待ち伏せて、通過の瞬間に攻撃する）
 * - 回る見張り（待ち伏せでも勝てるが遅い。止まりながら回る見張りを背後から追いかけると速い）
 * - 止まらずに回る見張り（追いかけても追いつけない。間合いを合わせて逆回りで迎え撃ち、先手を取る）
 * - 首をふる見張り（首振りを読み、見ていない時に寄るか、見ていない側へ回り込んで攻撃する）
 * - 迷路の見張り（総仕上げ。壁沿いに敵センサを足し、回り方か出発のタイミングで見張りとの出会い方を変える）
 */
export const CHAPTER3_STAGES: readonly Stage[] = [
  STILL_TARGET_STAGE, // 進んで攻撃（反撃なし）
  STANDING_SENTRY_STAGE, // 進んで攻撃（反撃あり・HP で競り勝つ）
  APPROACHING_SENTRY_STAGE, // 待ち構えて攻撃（自分から進むと競り負ける）
  PATROLLING_SENTRY_STAGE, // 待ち伏せして攻撃（正面からは競り負ける）
  CIRCLING_SENTRY_STAGE, // 背後から追いかけて攻撃（待ち伏せより速い）
  NONSTOP_CIRCLING_SENTRY_STAGE, // 逆回りで迎え撃ち、待って先手を取る（追いかけは通じない）
  SWINGING_SENTRY_STAGE, // 首振りを読み、タイミングか死角で近づく
  MAZE_SENTRY_STAGE, // 壁沿い＋攻撃で迷路を抜け、出会い方を変えて勝つ（総仕上げ）
];
