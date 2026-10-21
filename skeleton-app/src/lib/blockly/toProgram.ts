/**
 * Blockly ワークスペース → ドメインの命令木（Program）への変換。
 *
 * Blockly の文字列コードジェネレータは使わず、ブロックを直接走査して Stmt を組む
 * （出力は JS 文字列ではなく命令木。docs/design/execution-model.md §45）。
 */

import type { Block, Workspace } from "blockly";
import type { CommandName, Program, SensorName, Stmt } from "$lib/domain";
import { COMMAND_PREFIX } from "./blocks";

/** ワークスペースの先頭連鎖を Program に変換する。空なら空配列。 */
export function workspaceToProgram(ws: Workspace): Program {
  // PoC では「入力元を持たない連鎖」の最初の1本だけを対象にする。
  const top = ws.getTopBlocks(true).find((b) => b.previousConnection && !b.previousConnection.targetBlock());
  return top ? blockChainToStmts(top) : [];
}

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
    case "ctrl_if": {
      const elseBody = inputToStmts(block, "ELSE");
      return {
        kind: "if",
        cond: block.getFieldValue("COND") as SensorName,
        then: inputToStmts(block, "THEN"),
        // else が空なら省く（命令木を素直に保つ）。
        ...(elseBody.length > 0 ? { else: elseBody } : {}),
      };
    }
    case "ctrl_while":
      return {
        kind: "while",
        cond: block.getFieldValue("COND") as SensorName,
        body: inputToStmts(block, "BODY"),
      };
    default:
      return null;
  }
}
