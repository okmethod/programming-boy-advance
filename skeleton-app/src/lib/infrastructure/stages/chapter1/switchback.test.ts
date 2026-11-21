import { describe, it, expect } from "vitest";
import { programCost } from "#lib/domain";
import type { Program } from "#lib/domain";
import { cpMax, fwd, left, right, winsWith } from "#lib/infrastructure/stages/stage-test-kit";
import { SWITCHBACK_STAGE } from "./switchback";

// 2行ぶんの折り返し（右へ→右端で下へ→左へ→左端で下へ）を1単位にして while で回す想定解。
// 高さに依らず同じ本体を使い回せる＝向き変えの手組みを while 1 つに畳める（13 CP）。
const SOLUTION: Program = [
  {
    kind: "while",
    cond: { kind: "literal", value: true },
    body: [fwd, fwd, fwd, right, fwd, right, fwd, fwd, fwd, left, fwd, left],
  },
];

describe("SWITCHBACK_STAGE（折り返し道）", () => {
  it("while で折り返しを回し、奥の敵の正面に到達して勝てる（想定解が CP 上限に収まる）", () => {
    expect(programCost(SOLUTION)).toBeLessThanOrEqual(cpMax(SWITCHBACK_STAGE));
    expect(winsWith(SWITCHBACK_STAGE, SOLUTION)).toBe("ally");
  });

  it("壁を無視した直進では敵の正面に到達できない（辺壁が往来を塞いでいる）", () => {
    // 右へ進み続けるだけ＝上段の端で詰まり、敵のいる下段へ降りられない。
    const naive: Program = [{ kind: "repeat", count: 100, body: [fwd] }];
    expect(winsWith(SWITCHBACK_STAGE, naive)).not.toBe("ally");
  });
});
