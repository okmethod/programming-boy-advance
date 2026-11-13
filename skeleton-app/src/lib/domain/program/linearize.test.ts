import { describe, it, expect } from "vitest";
import { flatLines, nodeIdMap } from "./linearize";
import { runBattle } from "$lib/domain/battle";
import type { BattleState } from "$lib/domain/battle";
import type { Program } from "./model";

describe("flatLines / nodeIdMap", () => {
  const program: Program = [
    { kind: "call", cmd: "stepForward" },
    {
      kind: "if",
      cond: { kind: "sensor", sensor: "enemyAhead" },
      then: [{ kind: "call", cmd: "attack" }],
      else: [{ kind: "call", cmd: "stepForward" }],
    },
  ];

  it("flatten と nodeIdMap は同じ採番を共有する（pre-order）", () => {
    const lines = flatLines(program);
    const map = nodeIdMap(program);
    // 行の id（else 区切りを除く）と、Stmt→id の値が一致する。
    expect(lines.map((l) => l.id)).toEqual([0, 1, 2, null, 3]);
    expect(map.get(program[0])).toBe(0);
    expect(map.get(program[1])).toBe(1);
  });

  it("else 区切り行は id を持たない", () => {
    const elseLine = flatLines(program).find((l) => l.text === "else:");
    expect(elseLine?.id).toBeNull();
  });
});

describe("runBattle は実行中ノードを active に記録する", () => {
  function corridor(width: number): BattleState {
    return {
      grid: { width, height: 1, walls: [] },
      automatons: [
        { id: "ally", pos: { x: 0, y: 0 }, dir: "right", hp: 3, bp: 0, freezeRemaining: 0, priority: 1 },
        { id: "enemy", pos: { x: width - 1, y: 0 }, dir: "left", hp: 3, bp: 0, freezeRemaining: 0, priority: 0 },
      ],
      clock: 0,
      rngSeed: 0,
      logs: [],
      winner: null,
    };
  }

  it("前進2回のプログラムは各クロックで id 0 → 1 を実行する", () => {
    const ally: Program = [
      { kind: "call", cmd: "stepForward" },
      { kind: "call", cmd: "stepForward" },
    ];
    const { frames } = runBattle(corridor(6), ally, []);
    // frames[0] は初期状態（実行前）なので active なし。
    expect(frames[0].active).toBeUndefined();
    expect(frames[1].active?.ally).toBe(0);
    expect(frames[2].active?.ally).toBe(1);
  });
});
