/**
 * アプリ層の公開 API。
 *
 * プレゼン層からはこの入口を参照する。
 * 読みは store の readonly 投影、書きは facade のコマンドから取る（CQRS 分離を import の形に出す）。
 */

export { createBattleFacade } from "./usecases/battle/facade";
export type { BattleFacade, BattleRun } from "./usecases/battle/facade";
export type { SandboxTarget } from "./usecases/battle/sandbox";
export type { Stage, StageRepository } from "./ports/stageRepository";

export { createRegistryFacade } from "./usecases/registry/facade";
export type { RegistryFacade } from "./usecases/registry/facade";
export { registryImages, imageOf, labelOf } from "./usecases/registry/store";
export type { RegistryImage } from "./usecases/registry/store";
export type { PersistedImage, PersistedRegistry, RegistryRepository } from "./ports/registryRepository";

export { workbenchFacade } from "./usecases/workbench/facade";
export type { WorkbenchFacade } from "./usecases/workbench/facade";
export { workbenchDraft, currentImage, cpUsed, draftLines, differsFromBuilt } from "./usecases/workbench/store";
export type { WorkbenchDraft, CurrentImage } from "./usecases/workbench/store";
