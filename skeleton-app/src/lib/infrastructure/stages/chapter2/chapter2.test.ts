import { describe, it, expect } from "vitest";
import { programCost } from "#lib/domain";
import type { Program } from "#lib/domain";
import {
  AHEAD_FIRST,
  NAIVE_V3,
  RIGHT_ONLY,
  WALL_FOLLOWER,
  WALL_FOLLOWER_SIMPLE,
  cpMax,
  fwd,
  left,
  right,
  winsWith,
} from "#lib/infrastructure/stages/stage-test-kit";
import { RIGHT_HOOK_STAGE } from "./right-hook";
import { RIGHT_STEPS_STAGE } from "./right-steps";
import { RIGHT_SPIRAL_STAGE } from "./right-spiral";
import { BENT_CORRIDOR_STAGE } from "./bent-corridor";

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

describe("BENT_CORRIDOR_STAGE（左右まがり道・左折の初出）", () => {
  it("右手法のループ1本で折れ道を抜けて勝てる（CP 上限に収まる）", () => {
    expect(programCost(WALL_FOLLOWER)).toBeLessThanOrEqual(cpMax(BENT_CORRIDOR_STAGE));
    expect(winsWith(BENT_CORRIDOR_STAGE, WALL_FOLLOWER)).toBe("ally");
  });

  it("右手法の簡略形（右折だけの縮約形に「前が壁なら左折」を1つ並べた形）でも勝てる", () => {
    expect(programCost(WALL_FOLLOWER_SIMPLE)).toBeLessThanOrEqual(cpMax(BENT_CORRIDOR_STAGE));
    expect(winsWith(BENT_CORRIDOR_STAGE, WALL_FOLLOWER_SIMPLE)).toBe("ally");
  });

  it("右折だけの縮約形は行き止まりで詰まる＝左折の分岐を足す動機になる", () => {
    expect(winsWith(BENT_CORRIDOR_STAGE, RIGHT_ONLY)).not.toBe("ally");
  });

  it("前が壁になってから左右を選ぶ解は角の正面の袋小路ダミーへ入って詰まる＝右を先に見る必要がある", () => {
    expect(winsWith(BENT_CORRIDOR_STAGE, AHEAD_FIRST)).not.toBe("ally");
  });

  it("ベタ書き（区間ごとのくりかえし＋向き変え）は道をたどれるが CP 上限を超える", () => {
    const perLeg: Program = [
      { kind: "repeat", count: 2, body: [fwd] }, // 東2
      right,
      { kind: "repeat", count: 2, body: [fwd] }, // 南2
      left,
      { kind: "repeat", count: 2, body: [fwd] }, // 東2
      right,
      { kind: "repeat", count: 2, body: [fwd] }, // 南2
      right,
      { kind: "repeat", count: 3, body: [fwd] }, // 西3
    ];
    expect(winsWith(BENT_CORRIDOR_STAGE, perLeg)).toBe("ally");
    expect(programCost(perLeg)).toBeGreaterThan(cpMax(BENT_CORRIDOR_STAGE));
  });

  it("前方だけ見る v3 相当では袋小路ダミーへ直進して詰まる", () => {
    expect(winsWith(BENT_CORRIDOR_STAGE, NAIVE_V3)).not.toBe("ally");
  });
});
