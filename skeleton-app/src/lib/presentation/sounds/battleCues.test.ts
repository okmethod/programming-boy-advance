import { describe, it, expect } from "vitest";
import type { BattleState } from "#lib/application";
import { selectBattleCue, resolvePlaybackCue } from "#lib/presentation/sounds/battleCues";

// 差分検知に必要なフィールドだけを持つ最小盤面を組む（grid/clock 等は判定に無関係）。
function stateWith(ally: Partial<BattleState["automatons"][number]>): BattleState {
  return {
    grid: { width: 3, height: 3, walls: [] },
    automatons: [
      { id: "ally", pos: { x: 0, y: 0 }, dir: "up", hp: 3, bp: 0, freezeRemaining: 0, priority: 1, ...ally },
      { id: "enemy", pos: { x: 2, y: 2 }, dir: "down", hp: 3, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  };
}

describe("selectBattleCue", () => {
  it("差分が無ければ wait（何もしないクロックでも鳴らす）", () => {
    expect(selectBattleCue(stateWith({}), stateWith({}))).toBe("wait");
  });

  it("位置が変われば move", () => {
    expect(selectBattleCue(stateWith({}), stateWith({ pos: { x: 0, y: 1 } }))).toBe("move");
  });

  it("向きが変われば turn", () => {
    expect(selectBattleCue(stateWith({}), stateWith({ dir: "right" }))).toBe("turn");
  });

  it("HP が減れば damage", () => {
    expect(selectBattleCue(stateWith({}), stateWith({ hp: 1 }))).toBe("damage");
  });

  it("フリーズ開始で freeze", () => {
    expect(selectBattleCue(stateWith({}), stateWith({ freezeRemaining: 2 }))).toBe("freeze");
  });

  it("移動と被弾が重なれば被弾を優先", () => {
    const next = selectBattleCue(stateWith({}), stateWith({ pos: { x: 0, y: 1 }, hp: 1 }));
    expect(next).toBe("damage");
  });

  it("決着フレームは勝敗を最優先（ally 勝利は win）", () => {
    const prev = stateWith({});
    const cur: BattleState = { ...stateWith({ hp: 1 }), winner: "ally" };
    expect(selectBattleCue(prev, cur)).toBe("win");
  });

  it("enemy 勝利・draw は lose", () => {
    const prev = stateWith({});
    expect(selectBattleCue(prev, { ...stateWith({}), winner: "enemy" })).toBe("lose");
    expect(selectBattleCue(prev, { ...stateWith({}), winner: "draw" })).toBe("lose");
  });
});

describe("resolvePlaybackCue", () => {
  // 移動が起きる2フレーム列（index 1 で ally が1歩進む）。
  const frames = [stateWith({}), stateWith({ pos: { x: 0, y: 1 } })];

  it("再生中の前進で cue を返し、位置を鳴らし済みにする", () => {
    expect(resolvePlaybackCue(frames, 1, true, 0)).toEqual({ cue: "move", cuedIndex: 1 });
  });

  it("停止中は鳴らさず位置だけ同期する", () => {
    expect(resolvePlaybackCue(frames, 1, false, 0)).toEqual({ cue: null, cuedIndex: 1 });
  });

  it("同一フレームの再評価では鳴らさない（多重発火防止）", () => {
    expect(resolvePlaybackCue(frames, 1, true, 1)).toEqual({ cue: null, cuedIndex: 1 });
  });

  it("先頭フレームは鳴らさない", () => {
    expect(resolvePlaybackCue(frames, 0, true, -1)).toEqual({ cue: null, cuedIndex: -1 });
  });
});
