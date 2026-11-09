import { describe, it, expect } from "vitest";
import { applyAction, sensorValue, wallBetween, wallSide } from "$lib/domain";
import type { Automaton, BattleState, Position, WallEdge } from "$lib/domain";

// --- テスト用ヘルパー ---

function ally(pos: Position, dir: Automaton["dir"]): Automaton {
  return { id: "ally", pos, dir, hp: 3, bp: 0, freezeRemaining: 0, priority: 1 };
}

// 幅3×高さ1の一本道に ally だけ置く（辺壁の往来判定を単体で見る）。
function row(walls: readonly WallEdge[], pos: Position, dir: Automaton["dir"]): BattleState {
  return {
    grid: { width: 3, height: 1, walls },
    automatons: [ally(pos, dir)],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  };
}

const posOf = (s: BattleState): Position => s.automatons[0].pos;

describe("辺壁（WallEdge）", () => {
  it("wallSide は指定セルの指定方向の隣接セルとの辺を作る", () => {
    expect(wallSide({ x: 0, y: 0 }, "right")).toEqual({ a: { x: 0, y: 0 }, b: { x: 1, y: 0 } });
  });

  it("壁の無い辺へは前進できる", () => {
    const next = applyAction(row([], { x: 0, y: 0 }, "right"), "ally", { kind: "move" });
    expect(posOf(next)).toEqual({ x: 1, y: 0 });
  });

  it("前方の辺に壁があると前進できない（その場に留まる）", () => {
    const walls = [wallSide({ x: 0, y: 0 }, "right")];
    const next = applyAction(row(walls, { x: 0, y: 0 }, "right"), "ally", { kind: "move" });
    expect(posOf(next)).toEqual({ x: 0, y: 0 });
  });

  it("壁は往来対称＝反対セル側から記述しても同じ辺を塞ぐ", () => {
    // (1,0) の左辺 ＝ (0,0) の右辺。格納順が逆でも (0,0)→(1,0) の前進を塞ぐ。
    const walls = [wallSide({ x: 1, y: 0 }, "left")];
    const next = applyAction(row(walls, { x: 0, y: 0 }, "right"), "ally", { kind: "move" });
    expect(posOf(next)).toEqual({ x: 0, y: 0 });
  });

  it("wallAhead センサは前方の辺の壁を検知する", () => {
    const walls = [wallBetween({ x: 0, y: 0 }, { x: 1, y: 0 })];
    expect(sensorValue("wallAhead", row(walls, { x: 0, y: 0 }, "right"), "ally")).toBe(true);
    expect(sensorValue("wallAhead", row([], { x: 0, y: 0 }, "right"), "ally")).toBe(false);
  });

  it("場外は壁扱い＝盤面端では前進不可・wallAhead も真", () => {
    const edge = row([], { x: 2, y: 0 }, "right"); // 右端で右向き＝場外を向く
    expect(sensorValue("wallAhead", edge, "ally")).toBe(true);
    expect(posOf(applyAction(edge, "ally", { kind: "move" }))).toEqual({ x: 2, y: 0 });
  });
});
