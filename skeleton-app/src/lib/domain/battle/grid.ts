/**
 * 盤面の幾何：位置・方向の演算と、辺壁による通行判定。
 *
 * 状態（HP/BP 等）には触れない純粋な空間計算。query（sensor）と command（engine）の双方が使う共有部。
 */

import type { Direction, Grid, Position, WallEdge } from "./model";

const DIR_VECTORS: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const RIGHT_OF: Record<Direction, Direction> = { up: "right", right: "down", down: "left", left: "up" };
const LEFT_OF: Record<Direction, Direction> = { up: "left", left: "down", down: "right", right: "up" };

export function rotate(dir: Direction, rotation: "left" | "right"): Direction {
  return rotation === "right" ? RIGHT_OF[dir] : LEFT_OF[dir];
}

function add(a: Position, b: Position): Position {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function frontCell(pos: Position, dir: Direction): Position {
  return add(pos, DIR_VECTORS[dir]);
}

/** 隣接2セル間の壁（辺）を作る。往来判定は対称なので格納順は問わない。 */
export const wallBetween = (a: Position, b: Position): WallEdge => ({ a, b });

/** 指定セルの指定方向の辺に壁を作る（ステージ記述用＝「このセルの〇側に壁」）。 */
export const wallOn = (pos: Position, dir: Direction): WallEdge => ({ a: pos, b: frontCell(pos, dir) });

function isInBounds(grid: Grid, p: Position): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < grid.width && p.y < grid.height;
}

export function arePositionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

// from↔to の辺に壁があるか。往来は対称なので両向きで一致を見る。
function hasWallBetween(grid: Grid, from: Position, to: Position): boolean {
  return grid.walls.some(
    (w) =>
      (arePositionsEqual(w.a, from) && arePositionsEqual(w.b, to)) ||
      (arePositionsEqual(w.a, to) && arePositionsEqual(w.b, from)),
  );
}

// from から to へ進めないか。場外は壁と同じく「進めない」扱い、加えて from↔to の辺に壁があれば塞がれる。
export function isBlocked(grid: Grid, from: Position, to: Position): boolean {
  return !isInBounds(grid, to) || hasWallBetween(grid, from, to);
}
