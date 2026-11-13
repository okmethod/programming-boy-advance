/**
 * ドメイン層の公開 API。
 *
 * @architecture レイヤー間依存ルール - ドメイン層（最内）
 * - ROLE: 対戦ルール・プログラム解釈（純 TS・決定的）
 * - ALLOWED: 他層に依存しない
 * - FORBIDDEN: アプリ層・インフラ層・プレゼン層への依存
 * - CONSUMED BY: アプリ層・インフラ層のみ。プレゼン層からの直接 import は禁止（アプリ層バレル経由）
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
  WallEdge,
  Winner,
} from "./battle/battle";
export { withAllyInitialHp } from "./battle/battle";
export type {
  Action,
  CommandName,
  ControlName,
  Expr,
  NodeId,
  Program,
  SensorName,
  Step,
  Stmt,
} from "./program/program";
export type { AutomatonImage } from "./image/automatonImage";
export { imageHash } from "./image/automatonImage";
export type { BaseImage, BaseImageFamily } from "./image/baseImage";
export type { UsedCapabilities } from "./program/capabilities";

export {
  TURTLOGO_V1,
  TURTLOGO_V2,
  TURTLOGO_V3,
  BRITTLE_SENTRY,
  BASE_IMAGES,
  UNKNOWN_BASE_IMAGE,
  baseImageFamilies,
  baseImageSupports,
  baseImageAllowed,
  filterBaseImageFamilies,
  highestAllowedImage,
} from "./image/baseImage";

export { usedCapabilities } from "./program/capabilities";
export { programCost } from "./program/cost";
export { hashProgram, areProgramsEqual } from "./program/hash";
export { flatLines, nodeIdMap, type FlatLine } from "./program/nodes";
export { parseProgram, programToText, type ParseError, type ParseResult } from "./program/parse";

export { run } from "./battle/interpreter";

export type { BattleRun } from "./battle/runBattle";
export { resolveBattleParams, type BattleParams } from "./battle/params";
export {
  applyAction,
  advanceClock,
  commandToAction,
  exprValue,
  sensorValue,
  wallBetween,
  wallSide,
} from "./battle/engine";
export { runBattle, recordBattle, recordRun } from "./battle/runBattle";
