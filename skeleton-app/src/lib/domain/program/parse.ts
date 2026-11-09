/**
 * 擬似コード（テキスト）→ 命令木（Program）への逆変換パーサ。
 *
 * flatLines（Program → 行）の逆写像で、エディタ編集面のテキストを Program に戻す。
 * round-trip 不変条件: parseProgram(programToText(p)).program ≡ p（nodeIdMap ↔ flatLines と同種）。
 * 文法は小さい: `cmd()` / `repeat N:` / `while <cond>:` / `if <cond>:` / `else:`、
 * <cond> は sensor 名か `true`/`false`。インデントは 2 スペース = 1 段。
 *
 * 文法検証に加え、素質（granted）を渡すと「文法上妥当だが付与対象外の命令」を行つきで弾く。
 * ブロック編集ではツールボックスが構造的にこれを防ぐが、テキスト直接編集には素質ガードの穴があるため、
 * 認識点（＝行番号を持てる唯一の場所）でここに畳む（flatLines の連番ではなく元テキスト行を指すため）。
 */

import type { CommandName, Expr, Program, SensorName, Stmt } from "$lib/domain/models/program";
import type { UsedCapabilities } from "./capabilities";
import { flatLines } from "./nodes";

/**
 * パースが弾いた行。line は 1 始まりの元テキスト行番号（空行を詰めず元位置を指す）。
 * kind で性質を分ける: syntax＝文法が壊れている（ビルド不可）、capability＝文法は妥当だが素質が未付与。
 * 表示側はこの kind で色を変える（syntax=赤／capability=黄）。
 */
export interface ParseError {
  readonly line: number;
  readonly message: string;
  readonly kind: "syntax" | "capability";
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

/**
 * 擬似コードテキストを Program にパースする。エラーが 1 つでもあれば ok:false。
 * granted（素質の付与セット）を渡すと、付与対象外の命令も行つきエラーとして同じ errors に畳む
 * （構文エラーと同列＝ビルド不可）。省略時は文法だけを見る（round-trip・ブロック編集は無影響）。
 */
export const parseProgram = (text: string, granted?: UsedCapabilities): ParseResult => {
  const errors: ParseError[] = [];
  const lines: SourceLine[] = [];

  // 構文エラー（文法が壊れている＝ビルド不可）。capability エラーと kind で区別し表示側の色分けの根拠にする。
  const addSyntax = (line: number, message: string) => {
    errors.push({ line, message, kind: "syntax" });
  };

  // 素質（granted）が与えられ、かつ pool に name が無ければ「この素質では使えない」エラーを行つきで push する。
  // granted 省略時は pool が undefined になり素通し＝従来の文法検証だけになる。category は命令の分類（Command/Sensor/Control）。
  const denyIfUngranted = <T extends string>(
    pool: readonly T[] | undefined,
    name: T,
    line: number,
    category: string,
  ) => {
    if (pool && !pool.includes(name)) {
      errors.push({ line, message: `${category} not available in this base image: ${name}`, kind: "capability" });
    }
  };

  // 字句: 空行は無視しつつ元行番号を保つ。インデントは 2 スペース単位に正規化する。
  text.split("\n").forEach((raw, idx) => {
    const n = idx + 1;
    if (raw.trim() === "") return;
    const spaces = raw.length - raw.trimStart().length;
    if (spaces % 2 !== 0) {
      addSyntax(n, "Indent must be a multiple of 2 spaces");
    }
    lines.push({ n, indent: Math.floor(spaces / 2), text: raw.trim() });
  });

  let cursor = 0;

  // <cond> を Expr にする。true/false は literal、それ以外は sensor 名として検証する。
  const parseCond = (raw: string, n: number): Expr => {
    if (raw === "true") return { kind: "literal", value: true };
    if (raw === "false") return { kind: "literal", value: false };
    if (raw in SENSOR_NAMES) {
      denyIfUngranted(granted?.queries, raw as SensorName, n, "Sensor");
      return { kind: "sensor", sensor: raw as SensorName };
    }
    addSyntax(n, `Unknown condition: ${raw}`);
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
      if (cmd in COMMAND_NAMES) {
        denyIfUngranted(granted?.commands, cmd as CommandName, line.n, "Command");
        return { kind: "call", cmd: cmd as CommandName };
      }
      addSyntax(line.n, `Unknown command: ${cmd}`);
      return null;
    }

    const repeatMatch = /^repeat\s+(\d+):$/.exec(t);
    if (repeatMatch) {
      denyIfUngranted(granted?.controls, "repeat", line.n, "Control");
      const count = Number(repeatMatch[1]);
      if (count <= 0) addSyntax(line.n, "repeat count must be positive");
      const body = parseBlock(level + 1);
      return { kind: "repeat", count, body };
    }

    const whileMatch = /^while\s+(.+):$/.exec(t);
    if (whileMatch) {
      denyIfUngranted(granted?.controls, "while", line.n, "Control");
      const cond = parseCond(whileMatch[1].trim(), line.n);
      const body = parseBlock(level + 1);
      return { kind: "while", cond, body };
    }

    const ifMatch = /^if\s+(.+):$/.exec(t);
    if (ifMatch) {
      denyIfUngranted(granted?.controls, "if", line.n, "Control");
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

    addSyntax(line.n, `Syntax error: ${t}`);
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
        addSyntax(line.n, "Unexpected indentation");
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
    addSyntax(lines[cursor].n, `Unexpected line: ${lines[cursor].text}`);
    cursor++;
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, program };
};
