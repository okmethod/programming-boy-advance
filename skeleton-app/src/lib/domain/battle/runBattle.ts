/**
 * 対戦ループ：自キャラ（Ally）と敵キャラ（Enemy）のプログラムを共通クロックでロックステップ実行する。
 *
 * 各クロックで両者のインタプリタから1アクションずつ取り出し、
 * 同じ pre 状態に基づいて同時に適用する。
 * これにより対戦は決定的に進み、同入力なら必ず同結果になる。
 */

import type { Action, AutomatonId, BattleResult, BattleState, Program } from "../models/types";
import { applyTick } from "./engine";
import { run } from "../interpreter/run";

const DEFAULT_MAX_CLOCKS = 1000;

/** 対戦を最後まで実行し、結果（勝者・クロック数・最終状態）を返す。 */
export function runBattle(
  initial: BattleState,
  allyProgram: Program,
  enemyProgram: Program,
  options?: { maxClocks?: number },
): BattleResult {
  const frames = recordBattle(initial, allyProgram, enemyProgram, options);
  const finalState = frames[frames.length - 1];
  return { winner: finalState.winner ?? "draw", clocks: finalState.clock, finalState };
}

/**
 * 対戦を実行し、各クロックの状態列（初期状態を含む）を返す。観戦・リプレイ用。
 *
 * 決定的なので、同じ入力なら常に同じフレーム列になる。
 */
export function recordBattle(
  initial: BattleState,
  allyProgram: Program,
  enemyProgram: Program,
  options?: { maxClocks?: number },
): readonly BattleState[] {
  const maxClocks = options?.maxClocks ?? DEFAULT_MAX_CLOCKS;

  let state = initial;
  // インタプリタは最新状態を read() で参照する（ロックステップのため両者とも同じ pre 状態を見る）。
  const read = () => state;
  const allyGen = run(allyProgram, "ally", read);
  const enemyGen = run(enemyProgram, "enemy", read);

  const frames: BattleState[] = [state];

  // 膠着（状態が変化しない）が続いたら引き分けで打ち切るための検出。
  let prevSig = signature(state);
  let stallCount = 0;

  while (state.winner === null && state.clock < maxClocks) {
    const actions = new Map<AutomatonId, Action>([
      ["ally", nextAction(allyGen)],
      ["enemy", nextAction(enemyGen)],
    ]);
    state = applyTick(state, actions);
    frames.push(state);

    const sig = signature(state);
    if (sig === prevSig) {
      if (++stallCount >= 2) break;
    } else {
      stallCount = 0;
      prevSig = sig;
    }
  }

  return frames;
}

// ジェネレータが完了したオートマトンは、以降 wait（何もしない）とみなす。
function nextAction(gen: Generator<Action, void, unknown>): Action {
  const r = gen.next();
  return r.done ? { kind: "wait" } : r.value;
}

// 膠着検出用の状態シグネチャ（位置・向き・HP のみ。clock は含めない）。
function signature(state: BattleState): string {
  return state.automatons.map((e) => `${e.id}:${e.pos.x},${e.pos.y},${e.dir},${e.hp}`).join("|");
}
