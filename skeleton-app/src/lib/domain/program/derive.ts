/**
 * 命令木（プログラム）を走査して導く派生値の純関数群。
 * いずれも Program を再帰で走査し値を返すだけ（状態を持たず決定的）。
 */

import type { CommandName, ControlName, Expr, Program, SensorName, Stmt } from "./model";

/**
 * プログラム全体の CP 消費量を返す。CP は実行ステップ数ではなく「組んだブロック総数」。
 * repeat は中身の反復回数に関わらず 1 ブロックと数えるため「くりかえしで CP を節約する」設計意図
 * （docs/design/ux-level-design.md）を表す。
 * CP は戦闘に登場しない作成予算なので BattleState には持たせず Program から導く。
 */
export const programCost = (program: Program): number => program.reduce((sum, stmt) => sum + stmtCost(stmt), 0);

function stmtCost(stmt: Stmt): number {
  switch (stmt.kind) {
    case "call":
      return 1;
    case "repeat":
      return 1 + programCost(stmt.body);
    case "if":
      return 1 + programCost(stmt.then) + programCost(stmt.else ?? []);
    case "while":
      return 1 + programCost(stmt.body);
    default: {
      // 新しい Stmt 種別追加時の漏れを型で検出する。
      const _exhaustive: never = stmt;
      throw new Error(`Unknown stmt: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

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

/**
 * 命令木の内容等価（content-addressable な一致判定）。中身が同じなら true。
 * ハッシュ衝突に依らず正確に判定したいので、指紋比較ではなく構造の文字列化で突き合わせる
 * （命令木は順序のある素直な JSON なので文字列化比較で十分・YAGNI）。
 * イメージの内容指紋（imageHash）は素質も含めた同一性を見るので image 側に置く＝ここは program 単体の等価のみ。
 */
export const areProgramsEqual = (a: Program, b: Program): boolean => JSON.stringify(a) === JSON.stringify(b);
