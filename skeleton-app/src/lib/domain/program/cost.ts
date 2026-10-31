/**
 * プログラム（命令木）の作成コスト＝ CP（キャパシティ）を算出する。
 *
 * CP は「組んだブロック数」であって、実行ステップ数ではない。
 * repeat は中身を何回繰り返しても 1 ブロック分として数えるため、
 * 「くりかえしで CP を節約する」という設計意図（docs/design/ux-level-design.md）を表す。
 * CP は戦闘には登場しない作成予算なので BattleState には持たせず、Program から導く。
 */

import type { Program, Stmt } from "$lib/domain/models/program";

/** プログラム全体の CP 消費量（ブロック総数）を返す。 */
export function programCost(program: Program): number {
  return program.reduce((sum, stmt) => sum + stmtCost(stmt), 0);
}

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
