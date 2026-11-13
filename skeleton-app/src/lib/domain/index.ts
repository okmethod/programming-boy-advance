/**
 * ドメイン層の公開 API。
 *
 * @architecture レイヤー間依存ルール - ドメイン層（最内）
 * - ROLE: 対戦ルール・プログラム解釈（純 TS・決定的）
 * - ALLOWED: 他層に依存しない
 * - FORBIDDEN: アプリ層・インフラ層・プレゼン層への依存
 * - CONSUMED BY: アプリ層・インフラ層のみ。プレゼン層からの直接 import は禁止（アプリ層バレル経由）
 */

// 概念ごとのサブバレルを合成してドメイン層の公開面を編む（個別ファイルには降りない）。

// program＝命令木の言語モデルと操作（解析・コスト・整形・等価判定）。
export type {
  CommandName,
  ControlName,
  Expr,
  NodeId,
  Program,
  SensorName,
  Stmt,
  FlatLine,
  ParseError,
  ParseResult,
} from "./program";
export { programCost, areProgramsEqual, flatLines, nodeIdMap, parseProgram, programToText } from "./program";

// image＝ベースイメージ（素質）とオートマトンイメージ（素質×プログラム）。
export type { AutomatonImage, BaseImage, BaseImageFamily } from "./image";
export {
  imageHash,
  areImagesEqual,
  baseImageSupports,
  baseImageFamilies,
  baseImageAllowed,
  filterBaseImageFamilies,
  highestAllowedImage,
  TURTLOGO_V1,
  TURTLOGO_V2,
  TURTLOGO_V3,
  BRITTLE_SENTRY,
  BASE_IMAGES,
  UNKNOWN_BASE_IMAGE,
} from "./image";

// battle＝盤面モデルと対戦の実行。盤面の下位型や engine 純関数はドメイン内専用なので公開しない。
export type { Automaton, AutomatonId, BattleState, BattleRun, BattleParams, Direction, Winner } from "./battle";
export { withAllyInitialHp, resolveBattleParams, wallSide, runBattle, recordRun } from "./battle";
