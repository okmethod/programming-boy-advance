/**
 * 擬似コード（テキスト）→ 命令木（Program）への逆変換パーサ。
 *
 * flatLines（Program → 行）の逆写像で、エディタ編集面のテキストを Program に戻す。
 * round-trip 不変条件: parseProgram(programToText(p)).program ≡ p（nodeIdMap ↔ flatLines と同種）。
 * 文法は小さい: `cmd()` / `repeat N:` / `while <cond>:` / `if <cond>:` / `else:`、
 * <cond> は sensor 名か `true`/`false`。インデントは 2 スペース = 1 段。
 */

import type { CommandName, Expr, Program, SensorName, Stmt } from "$lib/domain/models/program";
import { flatLines } from "./nodes";

/** 構文エラー。line は 1 始まりの元テキスト行番号（空行を詰めず元位置を指す）。 */
export interface ParseError {
  readonly line: number;
  readonly message: string;
}

export type ParseResult =
  { readonly ok: true; readonly program: Program } | { readonly ok: false; readonly errors: readonly ParseError[] };

// 実行時バリデーション用の集合。satisfies で union の全キーを要求し、型追加時のドリフトをコンパイル時に捕まえる。
const COMMAND_NAMES = {
  stepForward: true,
  turnRight: true,
  turnLeft: true,
  attack: true,
  loadAttack: true,
  wait: true,
} satisfies Record<CommandName, true>;

const SENSOR_NAMES = {
  wallAhead: true,
  enemyAhead: true,
} satisfies Record<SensorName, true>;

/** Program を擬似コードテキストに直す（エディタ編集面のシードの正）。 */
export const programToText = (program: Program): string =>
  flatLines(program)
    .map((line) => "  ".repeat(line.indent) + line.text)
    .join("\n");

interface SourceLine {
  readonly n: number; // 元テキストの 1 始まり行番号
  readonly indent: number; // 2 スペース = 1 段に正規化した深さ
  readonly text: string; // trim 済みの中身
}

/** 擬似コードテキストを Program にパースする。エラーが 1 つでもあれば ok:false。 */
export const parseProgram = (text: string): ParseResult => {
  const errors: ParseError[] = [];
  const lines: SourceLine[] = [];

  // 字句: 空行は無視しつつ元行番号を保つ。インデントは 2 スペース単位に正規化する。
  text.split("\n").forEach((raw, idx) => {
    const n = idx + 1;
    if (raw.trim() === "") return;
    const spaces = raw.length - raw.trimStart().length;
    if (spaces % 2 !== 0) {
      errors.push({ line: n, message: "Indent must be a multiple of 2 spaces" });
    }
    lines.push({ n, indent: Math.floor(spaces / 2), text: raw.trim() });
  });

  let cursor = 0;

  // <cond> を Expr にする。true/false は literal、それ以外は sensor 名として検証する。
  const parseCond = (raw: string, n: number): Expr => {
    if (raw === "true") return { kind: "literal", value: true };
    if (raw === "false") return { kind: "literal", value: false };
    if (raw in SENSOR_NAMES) return { kind: "sensor", sensor: raw as SensorName };
    errors.push({ line: n, message: `Unknown condition: ${raw}` });
    return { kind: "literal", value: false }; // ok:false なので値は使われない（型を満たすだけ）
  };

  // lines[cursor]（indent === level）を 1 文として消費する。複合文は body を level+1 で再帰する。
  const parseStmt = (level: number): Stmt | null => {
    const line = lines[cursor];
    const t = line.text;
    cursor++;

    const callMatch = /^([a-zA-Z]+)\(\)$/.exec(t);
    if (callMatch) {
      const cmd = callMatch[1];
      if (cmd in COMMAND_NAMES) return { kind: "call", cmd: cmd as CommandName };
      errors.push({ line: line.n, message: `Unknown command: ${cmd}` });
      return null;
    }

    const repeatMatch = /^repeat\s+(\d+):$/.exec(t);
    if (repeatMatch) {
      const count = Number(repeatMatch[1]);
      if (count <= 0) errors.push({ line: line.n, message: "repeat count must be positive" });
      const body = parseBlock(level + 1);
      return { kind: "repeat", count, body };
    }

    const whileMatch = /^while\s+(.+):$/.exec(t);
    if (whileMatch) {
      const cond = parseCond(whileMatch[1].trim(), line.n);
      const body = parseBlock(level + 1);
      return { kind: "while", cond, body };
    }

    const ifMatch = /^if\s+(.+):$/.exec(t);
    if (ifMatch) {
      const cond = parseCond(ifMatch[1].trim(), line.n);
      const then = parseBlock(level + 1);
      // 同 level に続く else: だけを分岐として取り込む（else は Stmt ではなく区切り）。
      if (cursor < lines.length && lines[cursor].indent === level && lines[cursor].text === "else:") {
        cursor++;
        const elseBody = parseBlock(level + 1);
        return { kind: "if", cond, then, else: elseBody };
      }
      return { kind: "if", cond, then };
    }

    errors.push({ line: line.n, message: `Syntax error: ${t}` });
    return null;
  };

  // 同一 level の文を連続で読む。より浅い行・else: に出会ったら上位へ戻す。
  const parseBlock = (level: number): Stmt[] => {
    const stmts: Stmt[] = [];
    while (cursor < lines.length) {
      const line = lines[cursor];
      if (line.indent < level) break;
      if (line.text === "else:") break; // 親の if が処理する合図
      if (line.indent > level) {
        errors.push({ line: line.n, message: "Unexpected indentation" });
        cursor++;
        continue;
      }
      const stmt = parseStmt(level);
      if (stmt) stmts.push(stmt);
    }
    return stmts;
  };

  const program = parseBlock(0);
  // トップで消費しきれなかった行（孤立した else: など）は構文エラーとして報告する。
  while (cursor < lines.length) {
    errors.push({ line: lines[cursor].n, message: `Unexpected line: ${lines[cursor].text}` });
    cursor++;
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, program };
};
