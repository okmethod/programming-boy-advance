/**
 * 命令木のノード識別（実行ハイライトの土台）。
 *
 * 各 Stmt に pre-order（親→子、子リストは body / then → else の順）で連番 NodeId を振る。
 * インタプリタ（run）とプログラム表示（ProgramViewer）が同じ採番を共有することで、
 * 「今どのノードを実行中か」を id 1 つで突き合わせられる。
 * nodeIdMap と flattenProgram は同一の走査順を使う（＝実 Stmt を数える順が一致する）ことが不変条件。
 */

import type { Expr, NodeId, Program, Stmt } from "$lib/domain/models/program";

// 式（クエリ）を擬似コードの文字列にする。今はセンサ名（B面の実名）をそのまま出す。
function exprToText(expr: Expr): string {
  switch (expr.kind) {
    case "sensor":
      return expr.sensor;
    case "literal":
      return String(expr.value);
  }
}

/** 表示用に平坦化した1行。id は実 Stmt のノード id。else 等の区切り行は id を持たない。 */
export interface FlatLine {
  readonly id: NodeId | null;
  readonly text: string;
  readonly indent: number;
}

/** Stmt 参照 → NodeId の対応表を作る（インタプリタが yield 時に引く）。 */
export function nodeIdMap(program: Program): Map<Stmt, NodeId> {
  const map = new Map<Stmt, NodeId>();
  let n = 0;
  const visit = (stmts: readonly Stmt[]): void => {
    for (const s of stmts) {
      map.set(s, n++);
      switch (s.kind) {
        case "repeat":
        case "while":
          visit(s.body);
          break;
        case "if":
          visit(s.then);
          if (s.else) visit(s.else);
          break;
      }
    }
  };
  visit(program);
  return map;
}

/** プログラムを擬似コードの行に平坦化する。各行は nodeIdMap と同じ id を持つ。 */
export function flattenProgram(program: Program): FlatLine[] {
  const out: FlatLine[] = [];
  let n = 0;
  const visit = (stmts: readonly Stmt[], indent: number): void => {
    for (const s of stmts) {
      const id = n++;
      switch (s.kind) {
        case "call":
          out.push({ id, text: `${s.cmd}()`, indent });
          break;
        case "repeat":
          out.push({ id, text: `repeat ${s.count}:`, indent });
          visit(s.body, indent + 1);
          break;
        case "while":
          out.push({ id, text: `while ${exprToText(s.cond)}:`, indent });
          visit(s.body, indent + 1);
          break;
        case "if":
          out.push({ id, text: `if ${exprToText(s.cond)}:`, indent });
          visit(s.then, indent + 1);
          if (s.else) {
            // else は Stmt ではないので id を持たない区切り行（採番 n は進めない）。
            out.push({ id: null, text: "else:", indent });
            visit(s.else, indent + 1);
          }
          break;
      }
    }
  };
  visit(program, 0);
  return out;
}
