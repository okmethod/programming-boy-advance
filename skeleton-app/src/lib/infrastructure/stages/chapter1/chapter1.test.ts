import { describe, it, expect } from "vitest";
import { programCost, runBattle, withAllyInitialHp } from "#lib/domain";
import type { Program } from "#lib/domain";
import { STRAIGHT_CORRIDOR_STAGE } from "./straight-corridor";
import { L_CURVE_STAGE } from "./l-curve";
import { S_CURVE_STAGE } from "./s-curve";
import { LONG_CORRIDOR_STAGE } from "./long-corridor";
import { ZIGZAG_STAGE } from "./zigzag";
import { RING_STAGE } from "./ring";
import { SPIRAL_STAGE } from "./spiral";

const fwd = { kind: "call", cmd: "stepForward" } as const;
const right = { kind: "call", cmd: "turnRight" } as const;
const left = { kind: "call", cmd: "turnLeft" } as const;
// 壁があれば右折する条件分岐（壁クエリ＋if）。壁沿いの各ステージで使い回す。
const turnIfWall = { kind: "if", cond: { kind: "sensor", sensor: "wallAhead" }, then: [right] } as const;

// ステージの CP 上限＝配分でHPに1目盛り残すため memoryTotal−memoryGrain（CapacityAllocator の可動域）。
function cpMax(stage: { memoryTotal: number; memoryGrain: number }): number {
  return stage.memoryTotal - stage.memoryGrain;
}

// 攻撃を使わず、敵の正面に立つだけで勝てることを確認する共通ヘルパー。
function winsWith(stage: typeof STRAIGHT_CORRIDOR_STAGE, program: Program) {
  const state = withAllyInitialHp(stage.initial, 3);
  return runBattle(state, program, stage.enemy).result.winner;
}

describe("STRAIGHT_CORRIDOR_STAGE（まっすぐ）", () => {
  it("前進だけで敵の正面に到達して勝てる（想定解が CP 上限に収まる）", () => {
    const solution: Program = [fwd, fwd, fwd, fwd];
    expect(programCost(solution)).toBeLessThanOrEqual(cpMax(STRAIGHT_CORRIDOR_STAGE));
    expect(winsWith(STRAIGHT_CORRIDOR_STAGE, solution)).toBe("ally");
  });
});

describe("L_CURVE_STAGE（L字カーブ）", () => {
  it("向き変えで角を曲がって勝てる／直進だけでは正面に立てない", () => {
    const solution: Program = [fwd, fwd, fwd, right, fwd, fwd];
    expect(programCost(solution)).toBeLessThanOrEqual(cpMax(L_CURVE_STAGE));
    expect(winsWith(L_CURVE_STAGE, solution)).toBe("ally");
    // 直進し続けるだけ＝L字の角で詰まり、下りる列へ回れない。
    expect(winsWith(L_CURVE_STAGE, [{ kind: "repeat", count: 100, body: [fwd] }])).not.toBe("ally");
  });
});

describe("S_CURVE_STAGE（S字カーブ）", () => {
  it("右折・左折の S字で勝てる／直進だけでは正面に立てない", () => {
    const solution: Program = [fwd, fwd, right, fwd, fwd, left, fwd];
    expect(programCost(solution)).toBeLessThanOrEqual(cpMax(S_CURVE_STAGE));
    expect(winsWith(S_CURVE_STAGE, solution)).toBe("ally");
    // 直進し続けるだけ＝S字の最初の折れで詰まり、先へ進めない。
    expect(winsWith(S_CURVE_STAGE, [{ kind: "repeat", count: 100, body: [fwd] }])).not.toBe("ally");
  });
});

describe("ZIGZAG_STAGE（ジグザグ道）", () => {
  it("向き変えを含む本体の repeat でジグザグを登って勝てる", () => {
    const solution: Program = [{ kind: "repeat", count: 2, body: [fwd, right, fwd, left] }, fwd];
    expect(programCost(solution)).toBeLessThanOrEqual(cpMax(ZIGZAG_STAGE));
    expect(winsWith(ZIGZAG_STAGE, solution)).toBe("ally");
    // 向き変えなしの直進くりかえし＝最初の折れの壁で詰まり、ジグザグを登れない。
    expect(winsWith(ZIGZAG_STAGE, [{ kind: "repeat", count: 100, body: [fwd] }])).not.toBe("ally");
  });

  it("ジグザグのベタ書き（前進5＋向き変え4）は CP 上限を超える＝repeat を動機づける", () => {
    const flat: Program = [fwd, right, fwd, left, fwd, right, fwd, left, fwd];
    expect(programCost(flat)).toBeGreaterThan(cpMax(ZIGZAG_STAGE));
  });
});

describe("RING_STAGE（ロの字）", () => {
  it("「進んで、壁があれば右折」のくりかえしで外周を一周し、敵の正面で止まって勝てる", () => {
    const solution: Program = [{ kind: "repeat", count: 16, body: [fwd, turnIfWall] }];
    expect(programCost(solution)).toBeLessThanOrEqual(cpMax(RING_STAGE));
    expect(winsWith(RING_STAGE, solution)).toBe("ally");
    // 直進し続けるだけ＝上辺の東端で詰まり、外周を曲がれず敵の真下へ回れない。
    expect(winsWith(RING_STAGE, [{ kind: "repeat", count: 100, body: [fwd] }])).not.toBe("ally");
  });

  it("辺長が違う外周を per-leg のくりかえしでベタ書きすると CP 上限を超える＝壁クエリを動機づける", () => {
    // 上辺5・右辺3・下辺5・左辺1歩を回数指定でなぞる＝センサを使わない最短の組み方でも上限 8 を超える。
    const perLeg: Program = [
      { kind: "repeat", count: 5, body: [fwd] },
      right,
      { kind: "repeat", count: 3, body: [fwd] },
      right,
      { kind: "repeat", count: 5, body: [fwd] },
      right,
      fwd,
    ];
    expect(programCost(perLeg)).toBeGreaterThan(cpMax(RING_STAGE));
  });
});

describe("SPIRAL_STAGE（渦巻き・ロの字 その2）", () => {
  it("ロの字と同じ「進んで、壁があれば右折」のくりかえしで中心まで巻き込んで勝てる", () => {
    // 想定解は RING_STAGE と同一（回数だけ増やす）＝覚えた壁沿いがより複雑な道にそのまま効く。
    const solution: Program = [{ kind: "repeat", count: 40, body: [fwd, turnIfWall] }];
    expect(programCost(solution)).toBeLessThanOrEqual(cpMax(SPIRAL_STAGE));
    expect(winsWith(SPIRAL_STAGE, solution)).toBe("ally");
    // 直進し続けるだけ＝外周の角で詰まり、中心へ巻き込めない。
    expect(winsWith(SPIRAL_STAGE, [{ kind: "repeat", count: 100, body: [fwd] }])).not.toBe("ally");
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
