/**
 * プログラムが実際に使っている命令セット（コマンド／クエリ／制御）の抽出。
 *
 * 素質（BaseImage）切替の互換性ガードの土台。プログラムが使用する命令セットを収集する。
 * 走査順は nodeIdMap / flatLines と同じ（親→子、then→else・body）。
 */

import type { CommandName, ControlName, Expr, Program, SensorName, Stmt } from "./program";

/** プログラムが使用している命令セット（重複なし）。素質の付与セットと突き合わせる。 */
export interface UsedCapabilities {
  readonly commands: readonly CommandName[];
  readonly queries: readonly SensorName[];
  readonly controls: readonly ControlName[];
}

/** 命令木を走査して、使用中のコマンド／クエリ（センサ）／制御構文を集める。 */
export const usedCapabilities = (program: Program): UsedCapabilities => {
  const commands = new Set<CommandName>();
  const queries = new Set<SensorName>();
  const controls = new Set<ControlName>();

  const visitExpr = (expr: Expr): void => {
    if (expr.kind === "sensor") queries.add(expr.sensor);
  };
  const visit = (stmts: readonly Stmt[]): void => {
    for (const s of stmts) {
      switch (s.kind) {
        case "call":
          commands.add(s.cmd);
          break;
        case "if":
          controls.add("if");
          visitExpr(s.cond);
          visit(s.then);
          if (s.else) visit(s.else);
          break;
        case "repeat":
          controls.add("repeat");
          visit(s.body);
          break;
        case "while":
          controls.add("while");
          visitExpr(s.cond);
          visit(s.body);
          break;
      }
    }
  };
  visit(program);

  return { commands: [...commands], queries: [...queries], controls: [...controls] };
};
