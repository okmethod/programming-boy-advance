import { describe, it, expect } from "vitest";
import { wallOn } from "#lib/domain";
import { CHAPTER1_STAGES } from "./chapter1";
import { CHAPTER2_STAGES } from "./chapter2";
import { formatStageMap, parseStageMap } from "./stage-map";
import type { StageMap } from "./stage-map";
import { stageMapOf } from "./stage-test-kit";

// 壁リストを順序・向きに依らず比べられるよう、盤内の辺だけをキーの昇順に揃える。
function normalizeWalls(map: StageMap): string[] {
  const { width, height } = map.grid;
  const inBounds = (p: { x: number; y: number }) => p.x >= 0 && p.y >= 0 && p.x < width && p.y < height;
  const keys = map.grid.walls
    .filter((wall) => inBounds(wall.a) && inBounds(wall.b))
    .map((wall) => [`${wall.a.x},${wall.a.y}`, `${wall.b.x},${wall.b.y}`].sort().join("|"));
  return [...new Set(keys)].sort();
}

describe("parseStageMap", () => {
  it("盤内の壁と味方・敵の位置と向きを読み取り、外周は壁に含めない", () => {
    const map = parseStageMap(`
      +---+---+---+
      | A>  . | . |
      +   +---+   +
      | .   .   E<|
      +---+---+---+
    `);
    expect(map.grid.width).toBe(3);
    expect(map.grid.height).toBe(2);
    expect(map.grid.walls).toEqual(
      expect.arrayContaining([wallOn({ x: 1, y: 0 }, "down"), wallOn({ x: 1, y: 0 }, "right")]),
    );
    expect(map.grid.walls).toHaveLength(2);
    expect(map.ally).toEqual({ pos: { x: 0, y: 0 }, dir: "right" });
    expect(map.enemy).toEqual({ pos: { x: 2, y: 1 }, dir: "left" });
  });

  it("1×1 未満の図や行の長さが揃わない図は例外にする", () => {
    expect(() => parseStageMap("+---+")).toThrow();
    expect(() => parseStageMap("+---+---+\n| A>  E<|\n+---+")).toThrow(/line 3/);
  });

  it("外周が開いている図は例外にする", () => {
    expect(() => parseStageMap("+---+   +\n| A>  E<|\n+---+---+")).toThrow(/outer border/);
    expect(() => parseStageMap("+---+---+\n  A>  E<|\n+---+---+")).toThrow(/outer border/);
  });

  it("味方・敵がちょうど1体ずつでない図や、知らないセル記号は例外にする", () => {
    expect(() => parseStageMap("+---+---+\n| .   E<|\n+---+---+")).toThrow(/ally/);
    expect(() => parseStageMap("+---+---+\n| A>  A<|\n+---+---+")).toThrow(/ally/);
    expect(() => parseStageMap("+---+---+\n| A>  E?|\n+---+---+")).toThrow(/unknown cell/);
  });

  it("ASCII 図 → 盤面 → ASCII 図 の往復で元の図に戻る", () => {
    const source = ["+---+---+---+", "| A>  . | . |", "+   +---+   +", "| .   .   E<|", "+---+---+---+"].join("\n");
    expect(formatStageMap(parseStageMap(source))).toBe(source);
  });

  it.each([...CHAPTER1_STAGES, ...CHAPTER2_STAGES].map((stage) => [stage.id, stage] as const))(
    "登録済みステージ %s の盤面は、図へ変換して読み直しても壁・盤の大きさ・開始位置が変わらない",
    (_id, stage) => {
      const original = stageMapOf(stage);
      const roundTripped = parseStageMap(formatStageMap(original));
      expect(roundTripped.grid.width).toBe(original.grid.width);
      expect(roundTripped.grid.height).toBe(original.grid.height);
      expect(normalizeWalls(roundTripped)).toEqual(normalizeWalls(original));
      expect(roundTripped.ally).toEqual(original.ally);
      expect(roundTripped.enemy).toEqual(original.enemy);
    },
  );
});
