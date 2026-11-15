import { describe, it, expect } from "vitest";
import { sensorValue, exprValue } from "./sensor";
import { wallOn } from "./grid";
import type { Automaton, BattleState, Direction, Position, WallEdge } from "./model";

// --- テスト用ヘルパー ---

function automaton(id: Automaton["id"], pos: Position, dir: Direction): Automaton {
  return { id, pos, dir, hp: 3, bp: 0, freezeRemaining: 0, priority: id === "ally" ? 1 : 0 };
}

// 幅3×高さ1の一本道に自動機を並べて置く（前方判定を単体で見る）。
function row(walls: readonly WallEdge[], automatons: readonly Automaton[]): BattleState {
  return { grid: { width: 3, height: 1, walls }, automatons, clock: 0, rngSeed: 0, logs: [], winner: null };
}

describe("sensorValue（wallAhead）", () => {
  it("前方の辺に壁があれば真、無ければ偽", () => {
    const walls = [wallOn({ x: 0, y: 0 }, "right")];
    expect(sensorValue("wallAhead", row(walls, [automaton("ally", { x: 0, y: 0 }, "right")]), "ally")).toBe(true);
    expect(sensorValue("wallAhead", row([], [automaton("ally", { x: 0, y: 0 }, "right")]), "ally")).toBe(false);
  });

  it("場外も壁扱い＝盤面端で外を向くと真", () => {
    // 右端(x=2)で右向き＝場外を向く。
    expect(sensorValue("wallAhead", row([], [automaton("ally", { x: 2, y: 0 }, "right")]), "ally")).toBe(true);
  });
});

describe("sensorValue（enemyAhead）", () => {
  it("前方のマスに相手がいれば真、いなければ偽", () => {
    const ally = automaton("ally", { x: 0, y: 0 }, "right");
    const enemyAhead = automaton("enemy", { x: 1, y: 0 }, "left");
    const enemyAway = automaton("enemy", { x: 2, y: 0 }, "left");
    expect(sensorValue("enemyAhead", row([], [ally, enemyAhead]), "ally")).toBe(true);
    expect(sensorValue("enemyAhead", row([], [ally, enemyAway]), "ally")).toBe(false);
  });
});

describe("sensorValue（左右の壁）", () => {
  // 3×3 盤の中央(1,1)で右向き＝左は上セル・右は下セル。左右の辺を独立に見る。
  const at = (walls: readonly WallEdge[]): BattleState => ({
    grid: { width: 3, height: 3, walls },
    automatons: [automaton("ally", { x: 1, y: 1 }, "right")],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  });

  it("wallLeft＝進行方向の左の辺に壁があれば真", () => {
    expect(sensorValue("wallLeft", at([wallOn({ x: 1, y: 1 }, "up")]), "ally")).toBe(true);
    expect(sensorValue("wallLeft", at([wallOn({ x: 1, y: 1 }, "down")]), "ally")).toBe(false); // 右の辺は左に効かない
    expect(sensorValue("wallLeft", at([]), "ally")).toBe(false);
  });

  it("wallRight＝進行方向の右の辺に壁があれば真", () => {
    expect(sensorValue("wallRight", at([wallOn({ x: 1, y: 1 }, "down")]), "ally")).toBe(true);
    expect(sensorValue("wallRight", at([]), "ally")).toBe(false);
  });
});

describe("sensorValue（境界）", () => {
  it("自分が盤上にいなければ偽", () => {
    expect(sensorValue("wallAhead", row([], []), "ally")).toBe(false);
  });
});

describe("exprValue（式評価）", () => {
  const state = row([], [automaton("ally", { x: 2, y: 0 }, "right")]); // 前方は場外

  it("リテラルはそのまま返す", () => {
    expect(exprValue({ kind: "literal", value: true }, state, "ally")).toBe(true);
    expect(exprValue({ kind: "literal", value: false }, state, "ally")).toBe(false);
  });

  it("センサ式はセンサ評価に委譲する", () => {
    expect(exprValue({ kind: "sensor", sensor: "wallAhead" }, state, "ally")).toBe(true);
  });
});
