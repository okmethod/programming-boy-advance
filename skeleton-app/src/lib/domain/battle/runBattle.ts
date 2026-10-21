/**
 * 対戦ループ：自キャラ（Ally）と敵キャラ（Enemy）のプログラムを共通クロックで逐次実行する。
 *
 * 各クロックで、行動順（イニシアチブ）に従い1体ずつ「読む→1アクション適用」を解決する。
 * 後手は先手の行動を反映した最新状態を見て判断するため、同マス同時侵入の矛盾が起きない。
 * 対戦は決定的に進み、同入力なら必ず同結果になる。
 */

import type { Action, Automaton, AutomatonId, BattleResult, BattleState, Program } from "../models/types";
import { applyAction } from "./engine";
import { run } from "../interpreter/run";

const DEFAULT_MAX_CLOCKS = 1000;

// 行動順（イニシアチブ）：priority の高いオートマトンから動く。
// priority はオートマトンが持つ固定値のため、対戦を通じて不変。
// 同 priority は定義順（Array.sort の安定性）で決まる。
function turnOrder(automatons: readonly Automaton[]): readonly AutomatonId[] {
  return [...automatons].sort((a, b) => b.priority - a.priority).map((e) => e.id);
}

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
  // インタプリタは read() で最新状態を参照する。逐次解決なので後手は先手の行動後を見る。
  const read = () => state;
  const gens: Record<AutomatonId, Generator<Action, void, unknown>> = {
    ally: run(allyProgram, "ally", read),
    enemy: run(enemyProgram, "enemy", read),
  };

  // priority は固定値なので行動順は対戦を通じて不変。初期状態から一度だけ決める。
  const order = turnOrder(initial.automatons);

  const frames: BattleState[] = [state];

  // 膠着（状態が変化しない）が続いたら引き分けで打ち切るための検出。
  let prevSig = signature(state);
  let stallCount = 0;

  while (state.winner === null && state.clock < maxClocks) {
    // 1クロック内を行動順に1体ずつ解決する。先手が決着させたら後手は動かない。
    for (const id of order) {
      if (state.winner !== null) break;
      state = applyAction(state, id, nextAction(gens[id]));
    }
    state = { ...state, clock: state.clock + 1 };
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
