/**
 * frameCursor - 再生位置をフレーム列に重ねた読みモデル。
 *
 * frameIndex（再生 UI が持つ生の位置）を列の範囲にクランプし、現在/直前フレームとシーク上限をまとめて返す。
 * 観戦 route と試運転レールが同じクランプで再生カーソルを引くための単一の出どころ＝クランプのドリフトを防ぐ。
 */

import type { BattleState } from "#lib/application";

export interface FrameCursor {
  // 範囲内へクランプ済みの現在位置。
  readonly index: number;
  // 現在フレーム。列が空なら null。
  readonly current: BattleState | null;
  // 直前フレーム。先頭・空なら undefined（被弾など差分検出の比較元）。
  readonly prev: BattleState | undefined;
  // シーク上限（＝末尾の index）。
  readonly lastIndex: number;
}

/** frameIndex をフレーム列に重ね、クランプ済み位置・現在/直前フレーム・シーク上限を導く。 */
export function resolveFrameCursor(frames: readonly BattleState[], frameIndex: number): FrameCursor {
  const lastIndex = Math.max(0, frames.length - 1);
  const index = Math.min(Math.max(frameIndex, 0), lastIndex);
  const current = frames.length > 0 ? frames[index] : null;
  const prev = index > 0 ? frames[index - 1] : undefined;
  return { index, current, prev, lastIndex };
}
