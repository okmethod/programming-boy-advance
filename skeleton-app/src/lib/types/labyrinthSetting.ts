export type Cell = "00" | "01" | "10" | "11";
// "00" -> {r:0, b:0}, "01" -> {r:0, b:1}, etc.

interface PursedCell {
  r: boolean;
  b: boolean;
}

function parseCell(cell: Cell): PursedCell {
  return {
    r: parseInt(cell[0]) === 1,
    b: parseInt(cell[1]) === 1,
  };
}

export function parseMazeMatrix(mazeMatrix: Cell[][]): PursedCell[][] {
  return mazeMatrix.map((row) => row.map(parseCell));
}

export interface Position {
  row: number;
  col: number;
}

export enum Direction {
  Up = "up",
  Right = "right",
  Down = "down",
  Left = "left",
}

export interface LabyrinthSetting {
  mazeMatrix: Cell[][];
  startPos: Position;
  goalPos: Position;
  initialDirection: Direction;
}

export const directionStringMap: Record<Direction, string> = {
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};
