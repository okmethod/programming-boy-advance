/**
 * ステージの盤面（壁と開始位置）と ASCII 図を相互に変換する（parseStageMap / formatStageMap）。
 *
 * 壁を wallOn の列挙で書くと形が読み取りにくいため、盤面を図のまま書けるようにする入力書式。
 * ドメインのモデル（辺の壁 WallEdge）は変えず、図を今のモデルへ変換するだけ。
 * 将来ステージ定義を YAML 化するときに、盤面の項目としてそのまま使う想定（他の項目に依存させない）。
 *
 * 書式（セル1つ＝横4文字×縦2行。外周は必ず壁）:
 * ```
 * +---+---+---+
 * | A>  . | . |   セル中身: " . "＝通路 / " A>"＝味方 / " E^"＝敵（向き記号 > < ^ v）
 * +   +---+   +   セル間: "|"＝東西の壁、"---"＝南北の壁、空白＝通れる
 * | .   .   E<|
 * +---+---+---+
 * ```
 * 全行に共通する先頭の空白と行末の空白は無視する（コード内でインデントして書ける）。
 */

import { wallOn } from "#lib/domain";
import type { Automaton, BattleState, Direction } from "#lib/domain";

type Position = Automaton["pos"];

/** ASCII 図から得た盤面と、味方・敵の開始位置と向き。 */
export interface StageMap {
  readonly grid: BattleState["grid"];
  readonly ally: Pick<Automaton, "pos" | "dir">;
  readonly enemy: Pick<Automaton, "pos" | "dir">;
}

const DIRECTION_BY_SYMBOL: Readonly<Record<string, Direction>> = { ">": "right", "<": "left", "^": "up", v: "down" };

const CELL_WIDTH = 4; // "+---" / "| . " の4文字で1セル

const SYMBOL_BY_DIRECTION: Readonly<Record<Direction, string>> = { right: ">", left: "<", up: "^", down: "v" };

/** ASCII 図を盤面と開始位置へ変換する。書式に反する図は行・列つきの例外にする。 */
export function parseStageMap(source: string): StageMap {
  const lines = removeCommonIndent(source);
  if (lines.length < 3 || lines.length % 2 === 0) {
    throw new Error(`Stage map must have an odd number (>= 3) of lines, got ${lines.length}`);
  }
  const lineLength = lines[0].length;
  if ((lineLength - 1) % CELL_WIDTH !== 0 || lineLength < CELL_WIDTH + 1) {
    throw new Error(`Stage map line 1 has invalid length ${lineLength} (expected 4 * width + 1)`);
  }
  lines.forEach((line, i) => {
    if (line.length !== lineLength) {
      throw new Error(`Stage map line ${i + 1} has length ${line.length}, expected ${lineLength}`);
    }
  });

  const width = (lineLength - 1) / CELL_WIDTH;
  const height = (lines.length - 1) / 2;
  const walls: ReturnType<typeof wallOn>[] = [];
  const ally: Pick<Automaton, "pos" | "dir">[] = [];
  const enemy: Pick<Automaton, "pos" | "dir">[] = [];

  for (let row = 0; row <= height; row++) {
    const lineIndex = row * 2;
    const isOuter = row === 0 || row === height;
    for (let x = 0; x < width; x++) {
      const isWall = parseHorizontalEdge(lines[lineIndex], lineIndex, x, isOuter);
      // 外周は盤端として常に塞がるため、壁は盤内の辺（このセル行の上の辺＝1つ上のセルの南）だけ持つ。
      if (isWall && !isOuter) walls.push(wallOn({ x, y: row - 1 }, "down"));
    }
  }

  for (let y = 0; y < height; y++) {
    const lineIndex = y * 2 + 1;
    const line = lines[lineIndex];
    for (let x = 0; x <= width; x++) {
      const isOuter = x === 0 || x === width;
      const isWall = parseVerticalEdge(line, lineIndex, x, isOuter);
      if (isWall && !isOuter) walls.push(wallOn({ x: x - 1, y }, "right"));
    }
    for (let x = 0; x < width; x++) {
      const column = x * CELL_WIDTH + 1;
      const content = line.slice(column, column + 3);
      if (content === " . ") continue;
      const direction = DIRECTION_BY_SYMBOL[content[2]];
      const placement = { pos: { x, y }, dir: direction };
      if (content[0] === " " && content[1] === "A" && direction) ally.push(placement);
      else if (content[0] === " " && content[1] === "E" && direction) enemy.push(placement);
      else throw new Error(`Stage map line ${lineIndex + 1}, column ${column + 1}: unknown cell "${content}"`);
    }
  }

  if (ally.length !== 1) throw new Error(`Stage map must have exactly one ally (A), got ${ally.length}`);
  if (enemy.length !== 1) throw new Error(`Stage map must have exactly one enemy (E), got ${enemy.length}`);
  return { grid: { width, height, walls }, ally: ally[0], enemy: enemy[0] };
}

// 空行を除き、全行に共通する先頭の空白（コード内のインデント）を外す。
// 行ごとに trim すると、西の外周が開いた行（先頭が空白）の桁がずれるため、共通分だけ外す。
function removeCommonIndent(source: string): string[] {
  const lines = source.split("\n").filter((line) => line.trim() !== "");
  const indent = Math.min(...lines.map((line) => line.length - line.trimStart().length));
  return lines.map((line) => line.slice(indent).trimEnd());
}

// "+---+" 行の x 番目の辺が壁か。交点 "+" と、外周が壁で閉じていることも検査する。
function parseHorizontalEdge(line: string, lineIndex: number, x: number, isOuter: boolean): boolean {
  const column = x * CELL_WIDTH;
  if (line[column] !== "+" || line[column + CELL_WIDTH] !== "+") {
    throw new Error(`Stage map line ${lineIndex + 1}, column ${column + 1}: expected "+" at cell corners`);
  }
  const segment = line.slice(column + 1, column + CELL_WIDTH);
  if (segment !== "---" && segment !== "   ") {
    throw new Error(`Stage map line ${lineIndex + 1}, column ${column + 2}: unknown edge "${segment}"`);
  }
  if (isOuter && segment !== "---") {
    throw new Error(`Stage map line ${lineIndex + 1}, column ${column + 2}: outer border must be "---"`);
  }
  return segment === "---";
}

// セル行の x 番目の縦の辺（x=0 が西端、x=width が東端）が壁か。外周が壁で閉じていることも検査する。
function parseVerticalEdge(line: string, lineIndex: number, x: number, isOuter: boolean): boolean {
  const column = x * CELL_WIDTH;
  const symbol = line[column];
  if (symbol !== "|" && symbol !== " ") {
    throw new Error(`Stage map line ${lineIndex + 1}, column ${column + 1}: unknown edge "${symbol}"`);
  }
  if (isOuter && symbol !== "|") {
    throw new Error(`Stage map line ${lineIndex + 1}, column ${column + 1}: outer border must be "|"`);
  }
  return symbol === "|";
}

/**
 * 盤面と開始位置を ASCII 図へ変換する（parseStageMap の逆）。
 * 盤外を指す壁や重複した壁は図に表れないため、往復すると盤内の辺だけの壁リストに正規化される。
 */
export function formatStageMap(map: StageMap): string {
  const { width, height } = map.grid;
  const wallKeys = new Set(map.grid.walls.map((wall) => edgeKey(wall.a, wall.b)));
  const hasWall = (a: Position, b: Position): boolean => wallKeys.has(edgeKey(a, b));
  const cellContent = (x: number, y: number): string => {
    for (const [mark, placement] of [
      ["A", map.ally],
      ["E", map.enemy],
    ] as const) {
      if (placement.pos.x === x && placement.pos.y === y) return ` ${mark}${SYMBOL_BY_DIRECTION[placement.dir]}`;
    }
    return " . ";
  };

  const lines: string[] = [];
  for (let y = 0; y <= height; y++) {
    // セル行の上の辺（y=0 と y=height は外周）
    let border = "+";
    for (let x = 0; x < width; x++) {
      const isWall = y === 0 || y === height || hasWall({ x, y: y - 1 }, { x, y });
      border += (isWall ? "---" : "   ") + "+";
    }
    lines.push(border);
    if (y === height) break;
    let row = "";
    for (let x = 0; x < width; x++) {
      const isWall = x === 0 || hasWall({ x: x - 1, y }, { x, y });
      row += (isWall ? "|" : " ") + cellContent(x, y);
    }
    lines.push(row + "|");
  }
  return lines.join("\n");
}

// 辺の向きに依らない比較キー（往来は対称なので a/b の順を揃える）。
function edgeKey(a: Position, b: Position): string {
  const [first, second] = [`${a.x},${a.y}`, `${b.x},${b.y}`].sort();
  return `${first}|${second}`;
}
