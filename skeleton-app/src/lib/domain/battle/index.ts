/**
 * battle 概念の公開面（バレル）。盤面モデルと、対戦の実行（エンジン・パラメータ・解釈・1戦走行）。
 * 他ディレクトリ・ドメイン公開 API はこのバレル経由で参照する（内部ファイル構成を隠す）。
 * 同階層のファイル同士は自バレルを介さず直接 `./xxx` を参照する（バレル自己循環の回避）。
 */

export type {
  Direction,
  Position,
  AutomatonId,
  Automaton,
  WallEdge,
  Grid,
  Winner,
  DamageLog,
  BattleState,
  BattleResult,
} from "./battle";
export { withAllyInitialHp } from "./battle";
export { wallBetween, wallSide, commandToAction, exprValue, sensorValue, applyAction, advanceClock } from "./engine";
export type { BattleParams } from "./params";
export { BATTLE_PARAMS, resolveBattleParams } from "./params";
export { run } from "./interpreter";
export type { BattleRun } from "./runBattle";
export { runBattle, recordBattle, recordRun } from "./runBattle";
