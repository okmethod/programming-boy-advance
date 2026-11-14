/**
 * playbackCues - 再生位置の前進に合わせて効果音を鳴らす配線（rune ヘルパー）。
 *
 * frames/frameIndex/playing はゲッターで受け、$effect の依存に乗せる。
 * 本番対戦と試運転で同じ配線を使うため、副作用（playSE）を再生スコープに保ったまま一本化する。
 * コンポーネント初期化時に一度だけ呼ぶこと（$effect の制約）。
 */

import type { BattleState } from "#lib/application";
import { resolvePlaybackCue } from "./battleCues";
import { playSE } from "./soundEffects";

export function attachPlaybackCues(
  frames: () => readonly BattleState[],
  frameIndex: () => number,
  playing: () => boolean,
): void {
  let lastCuedIndex = -1;
  $effect(() => {
    const { cue, cuedIndex } = resolvePlaybackCue(frames(), frameIndex(), playing(), lastCuedIndex);
    lastCuedIndex = cuedIndex;
    if (cue) playSE[cue]();
  });
}
