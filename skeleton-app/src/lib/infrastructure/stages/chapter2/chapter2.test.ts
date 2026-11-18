import { describe, it, expect } from "vitest";
import { programCost, runBattle, withAllyInitialHp } from "#lib/domain";
import type { Program } from "#lib/domain";
import { RIGHT_HOOK_STAGE } from "./right-hook";
import { RIGHT_STEPS_STAGE } from "./right-steps";
import { RIGHT_SPIRAL_STAGE } from "./right-spiral";

const fwd = { kind: "call", cmd: "stepForward" } as const;
const right = { kind: "call", cmd: "turnRight" } as const;

// ステージの CP 上限＝配分でHPに1目盛り残すため memoryTotal−memoryGrain（CapacityAllocator の可動域）。
function cpMax(stage: { memoryTotal: number; memoryGrain: number }): number {
  return stage.memoryTotal - stage.memoryGrain;
}

// 攻撃を使わず、敵の正面に立つだけで勝てることを確認する共通ヘルパー。
function winsWith(stage: typeof RIGHT_HOOK_STAGE, program: Program) {
  const state = withAllyInitialHp(stage.initial, 3);
  return runBattle(state, program, stage.enemy).result.winner;
}

// 前方だけ見て「壁があれば右折」する v3 相当の素朴解。角の正面の袋小路ダミーへ直進して詰まる。
const NAIVE_V3: Program = [
  {
    kind: "while",
    cond: { kind: "literal", value: true },
    body: [fwd, { kind: "if", cond: { kind: "sensor", sensor: "wallAhead" }, then: [right] }],
  },
];

// 右が開けば右折、そうでなければ直進＝右手法の縮約形（左折なし）。入門面の最小解（CP 4）。
const RIGHT_ONLY: Program = [
  {
    kind: "while",
    cond: { kind: "literal", value: true },
    body: [{ kind: "if", cond: { kind: "not", operand: { kind: "sensor", sensor: "wallRight" } }, then: [right] }, fwd],
  },
];

describe("RIGHT_HOOK_STAGE（右まがり道・基本形）", () => {
  it("右が開いたら右折する縮約形で、階段道を下って勝てる（CP 上限に収まる）", () => {
    expect(programCost(RIGHT_ONLY)).toBeLessThanOrEqual(cpMax(RIGHT_HOOK_STAGE));
    expect(winsWith(RIGHT_HOOK_STAGE, RIGHT_ONLY)).toBe("ally");
  });

  it("前方だけ見る v3 相当では袋小路ダミーへ直進して詰まる＝右手センサを動機づける", () => {
    expect(winsWith(RIGHT_HOOK_STAGE, NAIVE_V3)).not.toBe("ally");
  });
});

describe("RIGHT_STEPS_STAGE（右まがり道 その2・非対称でベタ書き可）", () => {
  it("右手センサの縮約形がそのまま効く＝脚長が変わっても同じ手で勝てる（CP 上限に収まる）", () => {
    expect(programCost(RIGHT_ONLY)).toBeLessThanOrEqual(cpMax(RIGHT_STEPS_STAGE));
    expect(winsWith(RIGHT_STEPS_STAGE, RIGHT_ONLY)).toBe("ally");
  });

  it("脚別ベタ書き（くりかえしN{前}＋向き変え）でも道をたどれ、CP 上限にも収まる＝入門としてベタ書き可", () => {
    const perLeg: Program = [
      { kind: "repeat", count: 2, body: [fwd] }, // 東2
      right,
      { kind: "repeat", count: 3, body: [fwd] }, // 南3
      right,
      { kind: "repeat", count: 2, body: [fwd] }, // 西2
    ];
    expect(winsWith(RIGHT_STEPS_STAGE, perLeg)).toBe("ally");
    expect(programCost(perLeg)).toBeLessThanOrEqual(cpMax(RIGHT_STEPS_STAGE));
  });

  it("前方だけ見る v3 相当では袋小路ダミーへ直進して詰まる＝右手センサを動機づける", () => {
    expect(winsWith(RIGHT_STEPS_STAGE, NAIVE_V3)).not.toBe("ally");
  });
});

describe("RIGHT_SPIRAL_STAGE（右まがり道 その3・ループ強制）", () => {
  it("右手センサのループ1本で渦を巻き切って勝てる（CP 上限に収まる）", () => {
    expect(programCost(RIGHT_ONLY)).toBeLessThanOrEqual(cpMax(RIGHT_SPIRAL_STAGE));
    expect(winsWith(RIGHT_SPIRAL_STAGE, RIGHT_ONLY)).toBe("ally");
  });

  it("脚別ベタ書きは道はたどれるが CP 上限を超える＝ループに畳む右手センサ解を強制する", () => {
    const perLeg: Program = [
      { kind: "repeat", count: 2, body: [fwd] }, // 東2
      right,
      { kind: "repeat", count: 3, body: [fwd] }, // 南3
      right,
      { kind: "repeat", count: 2, body: [fwd] }, // 西2
      right,
      fwd, // 北1
    ];
    expect(winsWith(RIGHT_SPIRAL_STAGE, perLeg)).toBe("ally"); // ベタ書きでも道はたどれる
    expect(programCost(perLeg)).toBeGreaterThan(cpMax(RIGHT_SPIRAL_STAGE)); // が、CP 上限に収まらない
  });

  it("前方だけ見る v3 相当では袋小路ダミーへ直進して詰まる", () => {
    expect(winsWith(RIGHT_SPIRAL_STAGE, NAIVE_V3)).not.toBe("ally");
  });
});
