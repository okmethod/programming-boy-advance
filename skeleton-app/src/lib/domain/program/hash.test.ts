import { describe, it, expect } from "vitest";
import { areProgramsEqual } from "./hash";
import type { Program } from "$lib/domain/program/program";

describe("areProgramsEqual", () => {
  it("空プログラム同士は等価", () => {
    expect(areProgramsEqual([], [])).toBe(true);
  });

  it("同じ中身は等価", () => {
    const a: Program = [
      { kind: "call", cmd: "stepForward" },
      { kind: "call", cmd: "attack" },
    ];
    const b: Program = [
      { kind: "call", cmd: "stepForward" },
      { kind: "call", cmd: "attack" },
    ];
    expect(areProgramsEqual(a, b)).toBe(true);
  });

  it("順序が違えば非等価（命令木は順序を持つ）", () => {
    const a: Program = [
      { kind: "call", cmd: "stepForward" },
      { kind: "call", cmd: "attack" },
    ];
    const b: Program = [
      { kind: "call", cmd: "attack" },
      { kind: "call", cmd: "stepForward" },
    ];
    expect(areProgramsEqual(a, b)).toBe(false);
  });

  it("ネスト内の差分も拾う", () => {
    const a: Program = [{ kind: "repeat", count: 2, body: [{ kind: "call", cmd: "attack" }] }];
    const b: Program = [{ kind: "repeat", count: 3, body: [{ kind: "call", cmd: "attack" }] }];
    expect(areProgramsEqual(a, b)).toBe(false);
  });
});
