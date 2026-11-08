/**
 * アプリ層の公開 API。
 *
 * @architecture レイヤー間依存ルール - アプリ層
 * - ROLE: バトル進行・ゲーム状態管理（操作受付）
 * - ALLOWED: ドメイン層・自層 Port への依存
 * - FORBIDDEN: インフラ層（具体 Adapter）・プレゼン層への依存
 * - CONSUMED BY: プレゼン層（プレゼン層からの唯一の窓口）
 *
 * 読みは store の readonly 投影、書きは facade のコマンドから取る（CQRS 分離を import の形に出す）。
 * プレゼンが要るドメイン型/定数はここで re-export する。
 * プレゼン層からの直接 import は禁止（アプリ層バレル経由）
 */

// ドメイン型/定数の再公開（プレゼン層向けの単一窓口）
export type {
  Program,
  Expr,
  Stmt,
  CommandName,
  SensorName,
  ControlName,
  NodeId,
  FlatLine,
  BaseImage,
  BaseImageFamily,
  BattleState,
  AutomatonId,
  Direction,
  Winner,
  BattleRun,
} from "$lib/domain";
export { resolveBattleParams, DEFAULT_BASE_IMAGE } from "$lib/domain";

export { createBattleFacade } from "./usecases/battle/facade";
export type { BattleFacade } from "./usecases/battle/facade";
export type { SandboxTarget } from "./usecases/battle/sandbox";
export { buildActionLog } from "./usecases/battle/actionLog";
export type { ActionLogRow } from "./usecases/battle/actionLog";
export {
  battleSession,
  battleRun,
  allyLines,
  enemyLines,
  allyLog,
  enemyLog,
  deployedHash,
  enemyHash,
} from "./usecases/battle/store";
export type { BattleSession } from "./usecases/battle/store";
export type { Stage, StageRepository } from "./ports/stageRepository";

export { createRegistryFacade } from "./usecases/registry/facade";
export type { RegistryFacade } from "./usecases/registry/facade";
export { registryImages, imageOf, labelOf } from "./usecases/registry/store";
export type { RegistryImage } from "./usecases/registry/store";
export type { PersistedImage, PersistedRegistry, RegistryRepository } from "./ports/registryRepository";

export { workbenchFacade } from "./usecases/workbench/facade";
export type { WorkbenchFacade } from "./usecases/workbench/facade";
export {
  workbenchDraft,
  currentImage,
  cpUsed,
  draftLines,
  differsFromBuilt,
  baseImageCatalog,
  baseImageSupports,
} from "./usecases/workbench/store";
export type { WorkbenchDraft, CurrentImage } from "./usecases/workbench/store";
