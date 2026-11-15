import type { Stage } from "#lib/application";
import { BRITTLE_SENTRY, TURTLE_V3, wallOn } from "#lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "#lib/infrastructure/stages/chapter1/brittle-enemy";

// 中央（x=1..4, y=1..2）を壁で囲んだブロック＝外周だけが通れる ロの字。中央を塞ぐことで周回路を浮き彫りにする。
// 辺壁はセル間の辺なので、ブロックの外周（外側の辺）をぐるりと閉じてブロックを不可侵にする。
const CENTER_BLOCK_WALLS = [
  wallOn({ x: 0, y: 1 }, "up"),
  wallOn({ x: 1, y: 1 }, "up"),
  wallOn({ x: 2, y: 1 }, "up"),
  wallOn({ x: 3, y: 1 }, "up"),
  wallOn({ x: 4, y: 1 }, "up"),
  wallOn({ x: 1, y: 2 }, "down"),
  wallOn({ x: 2, y: 2 }, "down"),
  wallOn({ x: 3, y: 2 }, "down"),
  wallOn({ x: 4, y: 2 }, "down"),
  wallOn({ x: 1, y: 1 }, "left"),
  wallOn({ x: 1, y: 2 }, "left"),
  wallOn({ x: 4, y: 1 }, "right"),
  wallOn({ x: 4, y: 2 }, "right"),
];

export const RING_STAGE: Stage = {
  id: "ring",
  label: "ロの字", // 形状由来の名前。指示（進んで壁があったら曲がる）は goal に書く
  // 「進んで、壁があったら右に曲がる」をくりかえすと外周（ロの字）を一周でき、敵の正面で止まる。
  // 外周は辺長が違う（上辺5・右辺3…）＝曲がり角までの歩数が一定でない。固定歩数のベタ書きも per-leg の
  // くりかえしも CP 上限 8 を超え、壁クエリ（wallAhead＝場外・壁で真）で角を読む解だけが収まる＝センサ必須。
  goal: "「前に進む。壁があったら曲がる」をくりかえし、敵の正面まで移動しよう",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  allowedImages: [TURTLE_V3], // 条件分岐＋クエリ（v3）。壁を読んで分岐する導入面。
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: { width: 6, height: 4, walls: CENTER_BLOCK_WALLS },
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", pos: { x: 0, y: 0 }, dir: "right", hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 自機の真下 (0,1) で下（y 増）を向く＝正面セルは (0,2)。外周を一周した ally が真下から (0,2) に立つと自壊する。
      { id: "enemy", pos: { x: 0, y: 1 }, dir: "down", hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
