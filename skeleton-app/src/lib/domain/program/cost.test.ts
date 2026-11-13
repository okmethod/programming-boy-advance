import { describe, it, expect } from "vitest";
import { programCost } from "./cost";
import type { Program } from "./program";

describe("programCost", () => {
  it("空プログラムは 0", () => {
    expect(programCost([])).toBe(0);
  });

  it("call は 1 ブロック", () => {
    const p: Program = [{ kind: "call", cmd: "stepForward" }];
    expect(programCost(p)).toBe(1);
  });

  it("repeat は回数に関わらず『自身 + 中身』で数える（くりかえしで CP 節約）", () => {
    // repeat(1) + call(1) = 2。count=100 でも 2 のまま。
    const p: Program = [{ kind: "repeat", count: 100, body: [{ kind: "call", cmd: "stepForward" }] }];
    expect(programCost(p)).toBe(2);
  });

  it("if は then と else の両方を数える", () => {
    const p: Program = [
      {
        kind: "if",
        cond: { kind: "sensor", sensor: "enemyAhead" },
        then: [{ kind: "call", cmd: "attack" }],
        else: [{ kind: "call", cmd: "stepForward" }],
      },
    ];
    // if(1) + then(1) + else(1) = 3
    expect(programCost(p)).toBe(3);
  });

  it("ネストした命令木を再帰的に合算する", () => {
    const p: Program = [
      {
        kind: "repeat",
        count: 100,
        body: [
          {
            kind: "if",
            cond: { kind: "sensor", sensor: "enemyAhead" },
            then: [{ kind: "call", cmd: "attack" }],
            else: [{ kind: "call", cmd: "stepForward" }],
          },
        ],
      },
    ];
    // repeat(1) + if(1) + attack(1) + stepForward(1) = 4
    expect(programCost(p)).toBe(4);
  });
});
