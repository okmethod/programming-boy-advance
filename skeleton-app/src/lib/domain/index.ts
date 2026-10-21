/**
 * ドメイン層（バトルポッド）の公開 API。
 *
 * 外側（アプリ層・プレゼン層）からはこの入口を参照する。
 */

export type {
  Action,
  Automaton,
  AutomatonId,
  BattleResult,
  BattleState,
  CommandName,
  DamageLog,
  Direction,
  Grid,
  Position,
  Program,
  SensorName,
  Stmt,
  Winner,
} from "./models/types";

export { runBattle, recordBattle } from "./battle/runBattle";
export { run } from "./interpreter/run";
export { applyAction, commandToAction, evalSensor } from "./battle/engine";
