/**
 * 再開可能インタプリタ：プログラム（命令木）を1アクションずつ yield する。
 *
 * ジェネレータで「再開可能」を実現する（明示的 VM は不要）。
 * センサ評価はその時点の最新状態を read() から読む＝ロックステップで公平に判断できる。
 */

import type { Action, AutomatonId, BattleState, Program, Stmt } from "../models/types";
import { commandToAction, evalSensor } from "../battle/engine";

// yield を伴わないループ（空の while(true) 等）を検出するための上限。
// 正常にアクションを yield するループは、呼び出し側が maxClocks で pull を止めるため、ここには達しない。
const LOOP_GUARD = 100_000;

/** プログラムを、selfId 視点で1アクションずつ解釈するジェネレータを返す。 */
export function run(program: Program, selfId: AutomatonId, read: () => BattleState): Generator<Action, void, unknown> {
  return execStmts(program, selfId, read);
}

function* execStmts(
  stmts: readonly Stmt[],
  selfId: AutomatonId,
  read: () => BattleState,
): Generator<Action, void, unknown> {
  for (const s of stmts) {
    yield* execStmt(s, selfId, read);
  }
}

function* execStmt(s: Stmt, selfId: AutomatonId, read: () => BattleState): Generator<Action, void, unknown> {
  switch (s.kind) {
    case "call":
      yield commandToAction(s.cmd);
      return;
    case "repeat":
      for (let i = 0; i < s.count; i++) {
        yield* execStmts(s.body, selfId, read);
      }
      return;
    case "if":
      if (evalSensor(s.cond, read(), selfId)) {
        yield* execStmts(s.then, selfId, read);
      } else if (s.else) {
        yield* execStmts(s.else, selfId, read);
      }
      return;
    case "while": {
      let guard = 0;
      while (evalSensor(s.cond, read(), selfId)) {
        if (++guard > LOOP_GUARD) {
          throw new Error("Interpreter loop guard tripped: a loop iterated without yielding an action");
        }
        yield* execStmts(s.body, selfId, read);
      }
      return;
    }
    default: {
      const _exhaustive: never = s;
      throw new Error(`Unknown statement: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
