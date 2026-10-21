/**
 * バトルポッドのアプリ層ファサード。
 *
 * プレゼン層とドメイン層の継ぎ目。
 * プレイヤーの Program とステージを受け取り、観戦フレーム列と結果を返すエンドポイントを公開する。
 * ports/stores/usecases のフル4層化は、次ステージ/モードが要求するまで延期する（YAGNI）。
 */

import { recordBattle } from "$lib/domain";
import type { BattleResult, BattleState, Program } from "$lib/domain";
import type { Stage } from "./stage";

export interface BattleRun {
  // 観戦・リプレイ用の各クロックの状態列（初期状態を含む）。
  readonly frames: readonly BattleState[];
  readonly result: BattleResult;
}

/** プレイヤーの ally プログラムを指定ステージで対戦させ、観戦フレーム列と結果を返す。 */
export function runStage(stage: Stage, allyProgram: Program): BattleRun {
  const frames = recordBattle(stage.initial, allyProgram, stage.enemy);
  // 決定的なので結果は最終フレームから一意に導ける（対戦を二度回さない）。
  const finalState = frames[frames.length - 1];
  const result: BattleResult = {
    winner: finalState.winner ?? "draw",
    clocks: finalState.clock,
    finalState,
  };
  return { frames, result };
}
