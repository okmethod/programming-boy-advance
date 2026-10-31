/**
 * バトルポッドのアプリ層ファサード。
 *
 * プレゼン層とドメイン層の継ぎ目＝ UI からゲームロジックへの単一窓口。
 * ステージ取得は Port（StageRepository）経由に限り、供給元を UI から隠す。
 * 具体 Adapter は合成ルート（プレゼン層）で createBattleFacade に注入される。
 * stores/usecases のフル4層化は、次ステージ/モードが要求するまで延期する（YAGNI）。
 */

import { recordBattle } from "$lib/domain";
import type { BattleResult, BattleState, Program } from "$lib/domain";
import type { Stage, StageRepository } from "$lib/application/ports/stageRepository";

export interface BattleRun {
  // 観戦・リプレイ用の各クロックの状態列（初期状態を含む）。
  readonly frames: readonly BattleState[];
  readonly result: BattleResult;
}

/** UI が参照するゲームロジックの単一窓口。 */
export interface BattleFacade {
  /** ステージ定義を取得する（提示テキスト・初期盤面などの表示用）。 */
  getStage(stageId: string): Stage;
  /** ステージ選択 UI 用に全ステージ定義を一覧する。 */
  listStages(): readonly Stage[];
  /** 指定ステージでプレイヤーの ally プログラムを対戦させ、観戦フレーム列と結果を返す。 */
  runStage(stageId: string, allyProgram: Program): BattleRun;
}

/** StageRepository を注入してファサードを組み立てる（合成ルートから呼ぶ）。 */
export function createBattleFacade(stages: StageRepository): BattleFacade {
  function runStage(stageId: string, allyProgram: Program): BattleRun {
    const stage = stages.get(stageId);
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

  return {
    getStage: (stageId) => stages.get(stageId),
    listStages: () => stages.list(),
    runStage,
  };
}
