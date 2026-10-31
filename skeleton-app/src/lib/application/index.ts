/**
 * アプリ層の公開 API。
 *
 * プレゼン層からはこの入口を参照する。ステージの供給元は Port（StageRepository）の裏に隠れる。
 */

export { createBattleFacade } from "./usecases/battle/facade";
export type { BattleFacade, BattleRun } from "./usecases/battle/facade";
export type { Stage, StageRepository } from "./ports/stageRepository";
