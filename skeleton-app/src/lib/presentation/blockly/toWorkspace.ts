/**
 * ドメインの命令木（Program） → Blockly ワークスペースへの復元。
 *
 * workspaceToProgram の逆方向。Blockly ワークスペースを編集の SSoT に保つため、
 * お手本読み込みや保存復元は allyProgram を直接書き換えず、必ずこの経路でブロックに戻す。
 * 接続の手組みではなく Blockly ネイティブの serialization を使う
 *（描画あり／ヘッドレス（テスト）の両方で動くため）。
 */

import * as Blockly from "blockly";
import type { Workspace } from "blockly";
import type { Expr, Program, Stmt } from "$lib/domain";
import { COMMAND_PREFIX, QUERY_PREFIX } from "./blocks";

// Blockly の serialization が受け取るブロック状態（必要な部分だけを型付け）。
// x / y は先頭ブロックの配置座標（省略時は原点＝左上ぴったりに出る）。
interface BlockState {
  type: string;
  x?: number;
  y?: number;
  fields?: Record<string, unknown>;
  inputs?: Record<string, { block: BlockState }>;
  next?: { block: BlockState };
}

// 復元した先頭ブロックを左上の縁からわずかに離す余白（ワークスペース座標・px）。
const LOAD_MARGIN = 24;

/** Program をワークスペースに復元する。既存ブロックは消してから読み込む。 */
export function programToWorkspace(ws: Workspace, program: Program): void {
  ws.clear();
  const top = stmtsToState(program);
  if (!top) return;
  // 原点だと縁にぴったり付くので、少し余白を持たせた位置に置く。
  top.x = LOAD_MARGIN;
  top.y = LOAD_MARGIN;
  Blockly.serialization.workspaces.load({ blocks: { languageVersion: 0, blocks: [top] } }, ws);
}

// Stmt[] を next 連鎖の先頭ブロック状態にする。空なら undefined。
function stmtsToState(stmts: Program): BlockState | undefined {
  if (stmts.length === 0) return undefined;
  const [head, ...rest] = stmts;
  const state = stmtToState(head);
  const nextState = stmtsToState(rest);
  if (nextState) state.next = { block: nextState };
  return state;
}

// statement input（BODY / THEN / ELSE）へ子連鎖を載せる。空なら積まない。
function putInput(state: BlockState, inputName: string, body: Program): void {
  const child = stmtsToState(body);
  if (!child) return;
  state.inputs = { ...state.inputs, [inputName]: { block: child } };
}

// 条件スロット（COND）へクエリ値ブロックを載せる（blockToStmt 側の condToExpr の鏡写し）。
function putCond(state: BlockState, cond: Expr): void {
  const block: BlockState = { type: `${QUERY_PREFIX}${cond.sensor}` };
  state.inputs = { ...state.inputs, COND: { block } };
}

// 1つの Stmt を対応するブロック状態にする（blockToStmt の鏡写し）。
function stmtToState(stmt: Stmt): BlockState {
  switch (stmt.kind) {
    case "call":
      return { type: `${COMMAND_PREFIX}${stmt.cmd}` };
    case "repeat": {
      const state: BlockState = { type: "ctrl_repeat", fields: { COUNT: stmt.count } };
      putInput(state, "BODY", stmt.body);
      return state;
    }
    case "if": {
      // else があれば if/else ブロック、無ければ if のみブロックに戻す。
      const state: BlockState = { type: stmt.else ? "ctrl_if_else" : "ctrl_if" };
      putCond(state, stmt.cond);
      putInput(state, "THEN", stmt.then);
      if (stmt.else) putInput(state, "ELSE", stmt.else);
      return state;
    }
    case "while": {
      const state: BlockState = { type: "ctrl_while" };
      putCond(state, stmt.cond);
      putInput(state, "BODY", stmt.body);
      return state;
    }
  }
}
