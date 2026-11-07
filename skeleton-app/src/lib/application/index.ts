/**
 * アプリ層の公開 API。
 *
 * プレゼン層からはこの入口を参照する。ステージの供給元は Port（StageRepository）の裏に隠れる。
 */

export { createBattleFacade } from "./usecases/battle/facade";
export type { BattleFacade, BattleRun } from "./usecases/battle/facade";
export type { SandboxTarget } from "./usecases/battle/sandbox";
export type { Stage, StageRepository } from "./ports/stageRepository";

export { createRegistryFacade, registryImages } from "./usecases/registry/facade";
export type { RegistryFacade } from "./usecases/registry/facade";
export type { RegistryImage } from "./usecases/registry/store";
export type { PersistedImage, PersistedRegistry, RegistryRepository } from "./ports/registryRepository";

export { workbenchFacade, workbenchDraft } from "./usecases/workbench/facade";
export type { WorkbenchFacade } from "./usecases/workbench/facade";
export type { WorkbenchDraft } from "./usecases/workbench/store";
