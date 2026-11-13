import { describe, it, expect } from "vitest";
import { parseProgram, programToText } from "./parse";
import { TURTLOGO_V1, TURTLOGO_V2 } from "$lib/domain/image";
import type { Program } from "./program";

describe("parseProgram / programToText", () => {
  // 制御構文・ネスト・else・while(true) 糖衣を網羅する代表プログラム。
  const program: Program = [
    { kind: "call", cmd: "stepForward" },
    {
      kind: "while",
      cond: { kind: "literal", value: true },
      body: [
        {
          kind: "if",
          cond: { kind: "sensor", sensor: "enemyAhead" },
          then: [{ kind: "call", cmd: "attack" }],
          else: [
            { kind: "repeat", count: 3, body: [{ kind: "call", cmd: "stepForward" }] },
            { kind: "call", cmd: "turnRight" },
          ],
        },
      ],
    },
  ];

  it("round-trip: parseProgram(programToText(p)) は p に一致する", () => {
    const result = parseProgram(programToText(program));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.program).toEqual(program);
  });

  it("空テキストは空プログラム", () => {
    const result = parseProgram("");
    expect(result).toEqual({ ok: true, program: [] });
  });

  it("未知コマンドはエラー行を返す", () => {
    const result = parseProgram("fly()");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toEqual([{ line: 1, message: "Unknown command: fly", kind: "syntax" }]);
  });

  it("奇数インデントはエラー行を返す", () => {
    // 2 行目が 3 スペース（2 の倍数でない）。
    const result = parseProgram("repeat 2:\n   stepForward()");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.line === 2)).toBe(true);
  });

  it("孤立した else: はエラー", () => {
    const result = parseProgram("stepForward()\nelse:\n  attack()");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.line === 2)).toBe(true);
  });
});

describe("parseProgram（素質ガード）", () => {
  it("granted 省略時は文法だけを見る（V1 で使えない if も通る）", () => {
    const result = parseProgram("if enemyAhead:\n  attack()");
    expect(result.ok).toBe(true);
  });

  it("付与セット内なら通る（V2 は制御・センサを許可）", () => {
    // 内側コマンドは V2 が賄う stepForward（attack は v3 以降）。判定を制御(if)・センサ許可に絞る。
    const result = parseProgram("if enemyAhead:\n  stepForward()", TURTLOGO_V2);
    expect(result.ok).toBe(true);
  });

  it("付与対象外の制御・センサを元テキスト行つきで弾く（V1）", () => {
    // V1 は制御（if）もセンサ（enemyAhead）も未獲得＝2 行目の両方を弾く。1 行目の空白はそのまま行番号に効く。
    const result = parseProgram("\nif enemyAhead:\n  attack()", TURTLOGO_V1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContainEqual({
        line: 2,
        message: "Control not available in this base image: if",
        kind: "capability",
      });
      expect(result.errors).toContainEqual({
        line: 2,
        message: "Sensor not available in this base image: enemyAhead",
        kind: "capability",
      });
    }
  });

  it("付与対象外のコマンドを行つきで弾く（loadAttack はブロック未提供で V1/V2 とも非付与）", () => {
    const result = parseProgram("stepForward()\nloadAttack()", TURTLOGO_V2);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContainEqual({
        line: 2,
        message: "Command not available in this base image: loadAttack",
        kind: "capability",
      });
    }
  });
});
