/**
 * 対戦ループ：自キャラ（Ally）と敵キャラ（Enemy）のプログラムを共通クロックで逐次実行する。
 *
 * 各クロックで、行動順（priority の高い順）に従い1体ずつ「読む→1アクション適用」を解決する。
 * 後手は先手の行動を反映した最新状態を見て判断するため、同マス同時侵入の矛盾が起きない。
 * 対戦は決定的に進み、同入力なら必ず同結果になる。
 */

import type { NodeId, Program, Step } from "$lib/domain/program";
import { nodeIdMap } from "$lib/domain/program";
import type { Automaton, AutomatonId, BattleResult, BattleState } from "./model";
import { applyAction, advanceClock } from "./engine";
import { BATTLE_PARAMS, type BattleParams } from "./params";
import { interpret } from "./interpreter";

const DEFAULT_MAX_CLOCKS = 1000;

/** 記録された一戦＝観戦フレーム列と、そこから導いた結果。観戦・リプレイの読み元になる。 */
export interface BattleRun {
  // 各クロックの状態列（初期状態を含む）。
  readonly frames: readonly BattleState[];
  readonly result: BattleResult;
}

// 行動順：priority の高いオートマトンから動く。
// priority はオートマトンが持つ固定値のため、対戦を通じて不変。
const orderOfPriority = (automatons: readonly Automaton[]): readonly AutomatonId[] =>
  [...automatons].sort((a, b) => b.priority - a.priority).map((e) => e.id);

// フレーム列から対戦結果（勝者・クロック数・最終状態）を導く。
// 対戦は決定的なので結果は最終フレームから一意に定まる。
const resultOf = (frames: readonly BattleState[]): BattleResult => {
  const finalState = frames[frames.length - 1];
  return { winner: finalState.winner ?? "draw", clocks: finalState.clock, finalState };
};

// 膠着検出用の状態シグネチャ（clock は含めない）。
// BP・フリーズも含める：クールダウンやフリーズ減算を「進行」とみなし、回復途中での誤判定（早期引き分け）を防ぐ。
const signatureOf = (state: BattleState): string =>
  state.automatons.map((e) => `${e.id}:${e.pos.x},${e.pos.y},${e.dir},${e.hp},${e.bp},${e.freezeRemaining}`).join("|");

/**
 * 対戦を実行し、観戦フレーム列と結果（BattleRun）をまとめて返す。
 *
 * 各クロックで行動順に1体ずつ「読む→1アクション適用」を解決してフレーム列を積み、結果を導く。
 * 決定的なので同入力なら常に同じ BattleRun。結果だけ欲しければ .result を見る（二度回さない）。
 * ステージ対戦・試運転とも、この1本を入力（盤面・プログラム・オプション）だけ替えて呼ぶ。
 */
export function runBattle(
  initial: BattleState,
  allyProgram: Program,
  enemyProgram: Program,
  options?: { maxClocks?: number; params?: BattleParams; ignoreWinner?: boolean },
): BattleRun {
  const maxClocks = options?.maxClocks ?? DEFAULT_MAX_CLOCKS;
  const params = options?.params ?? BATTLE_PARAMS;
  // 試運転（サンドボックス）用：勝敗で打ち切らず、停止条件を膠着/最大クロックだけに委ねる。
  // 敵不在だと decideWinner が即「ally 勝利」を返すため、winner を都度 null に戻して走り続けさせる。
  const ignoreWinner = options?.ignoreWinner ?? false;

  let state = initial;
  // インタプリタは read() で最新状態を参照する。逐次解決なので後手は先手の行動後を見る。
  const read = () => state;
  // 各プログラムのノード id 表。interpret が yield する Step の nodeId はこの採番に従う。
  const gens: Record<AutomatonId, Generator<Step, void, unknown>> = {
    ally: interpret(allyProgram, "ally", read, nodeIdMap(allyProgram)),
    enemy: interpret(enemyProgram, "enemy", read, nodeIdMap(enemyProgram)),
  };

  // priority は固定値なので行動順は対戦を通じて不変。初期状態から一度だけ決める。
  const order = orderOfPriority(initial.automatons);

  const frames: BattleState[] = [state];

  // 膠着（状態が変化しない）が続いたら引き分けで打ち切るための検出。
  let prevSig = signatureOf(state);
  let stallCount = 0;

  while (state.winner === null && state.clock < maxClocks) {
    // このクロックで各オートマトンが実行した命令ノード（実行ハイライト用）。
    const active: Partial<Record<AutomatonId, NodeId>> = {};
    // 1クロック内を行動順に1体ずつ解決する。先手が決着させたら後手は動かない。
    for (const id of order) {
      if (state.winner !== null) break;
      const step = gens[id].next();
      // プログラム終了後は wait（何もしない）とみなし、ハイライト対象なし。
      const action = step.done ? ({ kind: "wait" } as const) : step.value.action;
      if (!step.done) active[id] = step.value.nodeId;
      state = applyAction(state, id, action, params);
      // 試運転では決着させない：winner が付いたら null に戻し、以降も applyAction が進むようにする。
      if (ignoreWinner && state.winner !== null) state = { ...state, winner: null };
    }
    // 全アクション解決後に時間経過（フリーズ減算・BP クールダウン・クロック+1）を適用する。
    state = advanceClock(state, params);
    state = { ...state, active };
    frames.push(state);

    const sig = signatureOf(state);
    if (sig === prevSig) {
      if (++stallCount >= 2) break;
    } else {
      stallCount = 0;
      prevSig = sig;
    }
  }

  return { frames, result: resultOf(frames) };
}
