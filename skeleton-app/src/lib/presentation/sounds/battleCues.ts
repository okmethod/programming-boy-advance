/**
 * battleCues - バトルの状態差分から鳴らすべき効果音(cue)を選ぶ純関数。
 *
 * 直前フレームと現フレームの差分だけで判定し、プログラム内部やノードに依存しない。
 * 再生ループ側はこの写像を購読して playSE を鳴らすだけに保つ（状態→SE の写像を純関数に閉じる）。
 */

import type { BattleState } from "#lib/application";
import type { BattleCue } from "#lib/presentation/sounds/soundEffects";

/**
 * 1クロック進んだ差分から効果音 cue を1つ返す。
 * 1フレームに複数の変化が重なっても鳴らすのは1つ＝重要度順（決着 > 被弾 > フリーズ > 旋回 > 移動）で選ぶ。
 * どれにも当たらない（何もしない）クロックでも進行の手応えを出すため wait を返す（常に音が鳴る）。
 */
export function selectBattleCue(prev: BattleState, cur: BattleState): BattleCue {
  // 決着は最優先（勝敗ジングルが他の SE を食う）。
  if (prev.winner == null && cur.winner != null) {
    return cur.winner === "ally" ? "win" : "lose";
  }

  let damaged = false;
  let froze = false;
  let turned = false;
  let moved = false;
  for (const after of cur.automatons) {
    const before = prev.automatons.find((a) => a.id === after.id);
    if (!before) continue;
    if (after.hp < before.hp) damaged = true;
    if (before.freezeRemaining === 0 && after.freezeRemaining > 0) froze = true;
    if (after.dir !== before.dir) turned = true;
    if (after.pos.x !== before.pos.x || after.pos.y !== before.pos.y) moved = true;
  }

  if (damaged) return "damage";
  if (froze) return "freeze";
  if (turned) return "turn";
  if (moved) return "move";
  return "wait";
}

/**
 * 再生位置から鳴らす cue と、次の「鳴らし済み位置」を決める（副作用なし）。
 * 再生ポリシー（自動再生中のみ・多重発火防止・範囲内）までを純粋側に畳み、
 * 呼び出す $effect は〈購読→この解決→保管→再生〉の配線だけに保つ。
 */
export function resolvePlaybackCue(
  frames: readonly BattleState[],
  index: number,
  playing: boolean,
  lastCuedIndex: number,
): { cue: BattleCue | null; cuedIndex: number } {
  // 手動シーク・停止中は鳴らさない（位置だけ同期して鳴らし済み扱いにする）。
  if (!playing) return { cue: null, cuedIndex: index };
  // 先頭・同一フレームの再評価では鳴らさない（$effect は再実行され得るため冪等に）。
  if (index <= 0 || index === lastCuedIndex) return { cue: null, cuedIndex: lastCuedIndex };
  const prev = frames[index - 1];
  const cur = frames[index];
  if (!prev || !cur) return { cue: null, cuedIndex: index };
  return { cue: selectBattleCue(prev, cur), cuedIndex: index };
}
