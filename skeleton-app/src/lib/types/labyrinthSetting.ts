export type Cell = "00" | "01" | "10" | "11";
// "00" -> {r:0, b:0}, "01" -> {r:0, b:1}, etc.

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
  maze: Cell[][];
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
