/**
 * センサ評価：盤面状態への純粋な問い合わせ（CQS の query 層）。状態は一切変えない。
 *
 * インタプリタが if/while の条件を判断するためにその時点の最新状態へ問い合わせる入口。
 */

import type { Expr, SensorName } from "$lib/domain/program";
import type { AutomatonId, BattleState } from "./model";
import { frontCell, isBlocked, arePositionsEqual } from "./grid";

/** 式（クエリ）を評価して真偽を返す。状態は変えない。 */
export const exprValue = (expr: Expr, state: BattleState, selfId: AutomatonId): boolean => {
  switch (expr.kind) {
    case "sensor":
      return sensorValue(expr.sensor, state, selfId);
    case "literal":
      return expr.value;
    default: {
      const _exhaustive: never = expr;
      throw new Error(`Unknown expr: ${JSON.stringify(_exhaustive)}`);
    }
  }
};

/** センサ（状態への純粋な問い合わせ）を評価する。状態は変えない。 */
export const sensorValue = (sensor: SensorName, state: BattleState, selfId: AutomatonId): boolean => {
  const self = state.automatons.find((e) => e.id === selfId);
  if (!self) return false;
  const front = frontCell(self.pos, self.dir);
  switch (sensor) {
    case "wallAhead":
      return isBlocked(state.grid, self.pos, front);
    case "enemyAhead": {
      const other = state.automatons.find((e) => e.id !== selfId && arePositionsEqual(e.pos, front));
      return other !== undefined;
    }
    default: {
      const _exhaustive: never = sensor;
      throw new Error(`Unknown sensor: ${String(_exhaustive)}`);
    }
  }
};
