import { describe, it, expect } from "vitest";
import { parseProgram, programToText } from "./parse";
import type { Program } from "$lib/domain/models/program";

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
    if (!result.ok) expect(result.errors).toEqual([{ line: 1, message: "Unknown command: fly" }]);
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
