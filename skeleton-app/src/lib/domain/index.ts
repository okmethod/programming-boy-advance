/**
 * ドメイン層（バトルポッド）の公開 API。
 *
 * 外側（アプリ層・プレゼン層）からはこの入口を参照する。
 */

export type {
  Automaton,
  AutomatonId,
  BattleResult,
  BattleState,
  DamageLog,
  Direction,
  Grid,
  Position,
  Winner,
} from "./models/battle";
export type { Action, CommandName, Expr, NodeId, Program, SensorName, Step, Stmt } from "./models/program";
export type { BaseImage, BaseImageFamily, ControlName } from "./baseimage/baseImage";
export type { UsedCapabilities } from "./program/capabilities";

export {
  TURTLOGO_V1,
  TURTLOGO_V2,
  BASE_IMAGES,
  DEFAULT_BASE_IMAGE,
  baseImageTag,
  versionTag,
  baseImageFamilies,
  baseImageSupports,
} from "./baseimage/baseImage";

export { usedCapabilities } from "./program/capabilities";
export { programCost } from "./program/cost";
export { hashProgram, areProgramsEqual } from "./program/hash";
export { flatLines, nodeIdMap, type FlatLine } from "./program/nodes";

export { run } from "./interpreter/run";

export type { BattleRun } from "./battle/runBattle";
export { BATTLE_PARAMS, type BattleParams } from "./battle/params";
export { applyAction, advanceClock, commandToAction, exprValue, sensorValue } from "./battle/engine";
export { runBattle, recordBattle, recordRun } from "./battle/runBattle";
