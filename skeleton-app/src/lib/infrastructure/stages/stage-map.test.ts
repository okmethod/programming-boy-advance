import { describe, it, expect } from "vitest";
import { wallOn } from "#lib/domain";
import { parseStageMap } from "./stage-map";

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
});
