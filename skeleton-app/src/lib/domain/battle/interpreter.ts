/**
 * 再開可能インタプリタ：プログラム（命令木）を1アクションずつ yield する。
 *
 * ジェネレータで「再開可能」を実現する（明示的 VM は不要）。
 * センサ評価はその時点の最新状態を read() から読む＝ロックステップで公平に判断できる。
 */

import type { NodeId, Program, Step, Stmt } from "#lib/domain/program";
import type { AutomatonId, BattleState } from "./model";
import { commandToAction } from "./engine";
import { exprValue } from "./sensor";

// yield を伴わないループ（空の while(true) 等）を検出するための上限。
// 正常にアクションを yield するループは、呼び出し側が maxClocks で pull を止めるため、ここには達しない。
const LOOP_GUARD = 100_000;

/**
 * プログラムを selfId 視点で1ステップ（アクション＋実行ノード id）ずつ解釈するジェネレータを返す。
 *
 * nodeIds は nodeIdMap(program) で作る Stmt→id 表。yield する call ノードの id を Step に載せる。
 */
export function interpret(
  program: Program,
  selfId: AutomatonId,
  read: () => BattleState,
  nodeIds: Map<Stmt, NodeId>,
): Generator<Step, void, unknown> {
  return execStmts(program, selfId, read, nodeIds);
}

function* execStmts(
  stmts: readonly Stmt[],
  selfId: AutomatonId,
  read: () => BattleState,
  nodeIds: Map<Stmt, NodeId>,
): Generator<Step, void, unknown> {
  for (const s of stmts) {
    yield* execStmt(s, selfId, read, nodeIds);
  }
}

function* execStmt(
  s: Stmt,
  selfId: AutomatonId,
  read: () => BattleState,
  nodeIds: Map<Stmt, NodeId>,
): Generator<Step, void, unknown> {
  switch (s.kind) {
    case "call":
      yield { action: commandToAction(s.cmd), nodeId: nodeIds.get(s) ?? -1 };
      return;
    case "repeat":
      for (let i = 0; i < s.count; i++) {
        yield* execStmts(s.body, selfId, read, nodeIds);
      }
      return;
    case "if":
      if (exprValue(s.cond, read(), selfId)) {
        yield* execStmts(s.then, selfId, read, nodeIds);
      } else if (s.else) {
        yield* execStmts(s.else, selfId, read, nodeIds);
      }
      return;
    case "while": {
      let guard = 0;
      while (exprValue(s.cond, read(), selfId)) {
        if (++guard > LOOP_GUARD) {
          throw new Error("Interpreter loop guard tripped: a loop iterated without yielding an action");
        }
        yield* execStmts(s.body, selfId, read, nodeIds);
      }
      return;
    }
    default: {
      const _exhaustive: never = s;
      throw new Error(`Unknown statement: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
