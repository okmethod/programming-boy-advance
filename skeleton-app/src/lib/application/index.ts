/**
 * アプリ層の公開 API。
 *
 * プレゼン層からはこの入口を参照する。
 */

export { runStage } from "./battleFacade";
export type { BattleRun } from "./battleFacade";
export { STAGE_01 } from "./stage";
export type { Stage } from "./stage";
