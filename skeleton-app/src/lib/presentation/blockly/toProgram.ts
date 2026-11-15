/**
 * Blockly ワークスペース → ドメインの命令木（Program）への変換。
 *
 * Blockly の文字列コードジェネレータは使わず、ブロックを直接走査して Stmt を組む
 * （出力は JS 文字列ではなく命令木。docs/design/execution-model.md §45）。
 */

import type { Block, Workspace } from "blockly";
import type { CommandName, Expr, Program, SensorName, Stmt } from "#lib/application";
import { COMMAND_PREFIX, OPERATOR_PREFIX, QUERY_PREFIX } from "./blocks";

/** ワークスペースの先頭連鎖を Program に変換する。空なら空配列。 */
export const workspaceToProgram = (ws: Workspace): Program => {
  // プログラムは1本の連鎖。入力元を持たない先頭ブロックの連鎖だけを対象にし、置き去りのブロックは無視する。
  const top = ws.getTopBlocks(true).find((b) => b.previousConnection && !b.previousConnection.targetBlock());
  return top ? blockChainToStmts(top) : [];
};

// next 接続で繋がったブロック列を Stmt[] に変換する。
function blockChainToStmts(start: Block): Stmt[] {
  const stmts: Stmt[] = [];
  let block: Block | null = start;
  while (block) {
    const stmt = blockToStmt(block);
    if (stmt) stmts.push(stmt);
    block = block.getNextBlock();
  }
  return stmts;
}

// statement input（BODY / THEN / ELSE）に繋がる子連鎖を Stmt[] に変換する。
function inputToStmts(block: Block, inputName: string): Stmt[] {
  const child = block.getInputTargetBlock(inputName);
  return child ? blockChainToStmts(child) : [];
}

// 条件スロット（COND）に繋がる値ブロックを Expr に変換する。
function condToExpr(block: Block): Expr {
  return exprFromBlock(block.getInputTargetBlock("COND"));
}

// 値ブロックを Expr に変換する。not（演算子）はオペランドを再帰的にたどる。
// 未選択（＜クエリ＞プレースホルダや未接続）なら既定センサにフォールバックし、Program を常に有効に保つ。
function exprFromBlock(block: Block | null): Expr {
  if (block?.type.startsWith(OPERATOR_PREFIX)) {
    const op = block.type.slice(OPERATOR_PREFIX.length);
    if (op === "not") {
      return { kind: "not", operand: exprFromBlock(block.getInputTargetBlock("OPERAND")) };
    }
  }
  if (block?.type.startsWith(QUERY_PREFIX)) {
    return { kind: "sensor", sensor: block.type.slice(QUERY_PREFIX.length) as SensorName };
  }
  return { kind: "sensor", sensor: "enemyAhead" as SensorName };
}

function blockToStmt(block: Block): Stmt | null {
  const type = block.type;

  if (type.startsWith(COMMAND_PREFIX)) {
    const cmd = type.slice(COMMAND_PREFIX.length) as CommandName;
    return { kind: "call", cmd };
  }

  switch (type) {
    case "ctrl_repeat":
      return {
        kind: "repeat",
        count: Number(block.getFieldValue("COUNT")),
        body: inputToStmts(block, "BODY"),
      };
    case "ctrl_if":
      // if のみ（else 無しブロック）。
      return {
        kind: "if",
        cond: condToExpr(block),
        then: inputToStmts(block, "THEN"),
      };
    case "ctrl_if_else": {
      const elseBody = inputToStmts(block, "ELSE");
      return {
        kind: "if",
        cond: condToExpr(block),
        then: inputToStmts(block, "THEN"),
        // else が空なら省く（命令木を素直に保つ）。
        ...(elseBody.length > 0 ? { else: elseBody } : {}),
      };
    }
    case "ctrl_forever":
      // 「ずっとくりかえす」= 条件が常に真の while（案A：Stmt 種別を増やさない糖衣）。
      return {
        kind: "while",
        cond: { kind: "literal", value: true },
        body: inputToStmts(block, "BODY"),
      };
    case "ctrl_while":
      return {
        kind: "while",
        cond: condToExpr(block),
        body: inputToStmts(block, "BODY"),
      };
    default:
      return null;
  }
}
