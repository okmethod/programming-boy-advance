import { describe, it, expect } from "vitest";
import { rotate, frontCell, wallOn, wallBetween, isBlocked } from "./grid";
import type { Grid, Position } from "./model";

describe("rotate（旋回）", () => {
  it("右回転を4回で一周して元に戻る", () => {
    expect(rotate(rotate(rotate(rotate("up", "right"), "right"), "right"), "right")).toBe("up");
  });

  it("右回転と左回転は逆向き", () => {
    expect(rotate("up", "right")).toBe("right");
    expect(rotate("up", "left")).toBe("left");
  });
});

describe("frontCell（前方セル）", () => {
  it("向きに応じて隣接セルを指す", () => {
    expect(frontCell({ x: 1, y: 1 }, "right")).toEqual({ x: 2, y: 1 });
    expect(frontCell({ x: 1, y: 1 }, "up")).toEqual({ x: 1, y: 0 });
  });
});

describe("壁ファクトリ（wallOn / wallBetween）", () => {
  it("wallOn は指定セルの指定方向の隣接セルとの辺を作る", () => {
    expect(wallOn({ x: 0, y: 0 }, "right")).toEqual({ a: { x: 0, y: 0 }, b: { x: 1, y: 0 } });
  });

  it("wallBetween は2セル間の辺をそのまま作る", () => {
    expect(wallBetween({ x: 0, y: 0 }, { x: 1, y: 0 })).toEqual({ a: { x: 0, y: 0 }, b: { x: 1, y: 0 } });
  });
});

describe("isBlocked（通行判定）", () => {
  const grid = (walls: Grid["walls"]): Grid => ({ width: 3, height: 1, walls });
  const right = (from: Position): Position => frontCell(from, "right");

  it("壁の無い隣接セルへは進める", () => {
    expect(isBlocked(grid([]), { x: 0, y: 0 }, right({ x: 0, y: 0 }))).toBe(false);
  });

  it("前方の辺に壁があると進めない", () => {
    expect(isBlocked(grid([wallOn({ x: 0, y: 0 }, "right")]), { x: 0, y: 0 }, { x: 1, y: 0 })).toBe(true);
  });

  it("壁は往来対称＝反対セル側から記述しても同じ辺を塞ぐ", () => {
    // (1,0) の左辺 ＝ (0,0) の右辺。格納順が逆でも (0,0)→(1,0) を塞ぐ。
    expect(isBlocked(grid([wallOn({ x: 1, y: 0 }, "left")]), { x: 0, y: 0 }, { x: 1, y: 0 })).toBe(true);
  });

  it("場外（盤面端の外）は壁扱いで進めない", () => {
    expect(isBlocked(grid([]), { x: 2, y: 0 }, { x: 3, y: 0 })).toBe(true);
  });
});
