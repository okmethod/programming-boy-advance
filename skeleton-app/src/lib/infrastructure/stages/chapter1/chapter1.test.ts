import { describe, it, expect } from "vitest";
import { programCost, runBattle, withAllyInitialHp } from "$lib/domain";
import type { Program } from "$lib/domain";
import { STRAIGHT_CORRIDOR_STAGE } from "./straight-corridor";
import { CORNER_TURN_STAGE } from "./corner-turn";
import { LONG_CORRIDOR_STAGE } from "./long-corridor";

const fwd = { kind: "call", cmd: "stepForward" } as const;
const right = { kind: "call", cmd: "turnRight" } as const;

// ステージの CP 上限＝配分でHPに1目盛り残すため memoryTotal−memoryGrain（CapacityAllocator の可動域）。
function cpMax(stage: { memoryTotal: number; memoryGrain: number }): number {
  return stage.memoryTotal - stage.memoryGrain;
}

// 攻撃を使わず、敵の正面に立つだけで勝てることを確認する共通ヘルパー。
function winsWith(stage: typeof STRAIGHT_CORRIDOR_STAGE, program: Program) {
  const state = withAllyInitialHp(stage.initial, 3);
  return runBattle(state, program, stage.enemy).winner;
}

describe("STRAIGHT_CORRIDOR_STAGE（まっすぐ）", () => {
  it("前進だけで敵の正面に到達して勝てる（想定解が CP 上限に収まる）", () => {
    const solution: Program = [fwd, fwd, fwd, fwd];
    expect(programCost(solution)).toBeLessThanOrEqual(cpMax(STRAIGHT_CORRIDOR_STAGE));
    expect(winsWith(STRAIGHT_CORRIDOR_STAGE, solution)).toBe("ally");
  });
});

describe("CORNER_TURN_STAGE（かどを曲がる）", () => {
  it("向き変えで角を曲がって勝てる／直進だけでは正面に立てない", () => {
    const solution: Program = [fwd, fwd, fwd, right, fwd, fwd];
    expect(programCost(solution)).toBeLessThanOrEqual(cpMax(CORNER_TURN_STAGE));
    expect(winsWith(CORNER_TURN_STAGE, solution)).toBe("ally");
    // 直進し続けるだけ＝敵は別の列・行に居るので正面に立てない。
    expect(winsWith(CORNER_TURN_STAGE, [{ kind: "repeat", count: 100, body: [fwd] }])).not.toBe("ally");
  });
});

describe("LONG_CORRIDOR_STAGE（ながい廊下）", () => {
  // 盤面幅 12＝敵の正面 (10,0) までの道のりは 10 歩。前進のベタ書き列を組む。
  const straightLine: Program = Array.from({ length: 10 }, () => fwd);

  it("直進ベタ書きは CP 上限を超える＝v1 では組めない（CP の壁で v2 を動機づける）", () => {
    expect(programCost(straightLine)).toBeGreaterThan(cpMax(LONG_CORRIDOR_STAGE));
  });

  it("repeat（v2）なら CP 上限内で組めて勝てる", () => {
    const solution: Program = [{ kind: "repeat", count: 10, body: [fwd] }];
    expect(programCost(solution)).toBeLessThanOrEqual(cpMax(LONG_CORRIDOR_STAGE));
    expect(winsWith(LONG_CORRIDOR_STAGE, solution)).toBe("ally");
  });
});
