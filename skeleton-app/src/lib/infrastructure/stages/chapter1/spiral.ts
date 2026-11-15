import type { Stage } from "#lib/application";
import { BRITTLE_SENTRY, TURTLE_V3, wallOn } from "#lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "#lib/infrastructure/stages/chapter1/brittle-enemy";

// 5x5 を時計回りに内へ巻き込む幅1の渦巻き通路。外周→内周と右折だけで中心に至る。
// 隣り合うが通路として連続しないセルの間を壁で閉じ、一本道の渦巻きに整える。
// 想定解はロの字（ring）と同一＝「進んで、壁があれば右折」のくりかえし。道が長くなっても同じ手で通せる。
const SPIRAL_WALLS = [
  // 外周アームと内周アームを隔てる縦の辺（セルの下側）。
  wallOn({ x: 0, y: 0 }, "down"),
  wallOn({ x: 1, y: 0 }, "down"),
  wallOn({ x: 2, y: 0 }, "down"),
  wallOn({ x: 3, y: 0 }, "down"),
  wallOn({ x: 1, y: 1 }, "down"),
  wallOn({ x: 2, y: 1 }, "down"),
  wallOn({ x: 2, y: 2 }, "down"),
  wallOn({ x: 1, y: 3 }, "down"),
  wallOn({ x: 2, y: 3 }, "down"),
  wallOn({ x: 3, y: 3 }, "down"),
  // 同じく横の辺（セルの右側）。
  wallOn({ x: 3, y: 1 }, "right"),
  wallOn({ x: 0, y: 2 }, "right"),
  wallOn({ x: 2, y: 2 }, "right"),
  wallOn({ x: 3, y: 2 }, "right"),
  wallOn({ x: 0, y: 3 }, "right"),
  wallOn({ x: 3, y: 3 }, "right"),
];

export const SPIRAL_STAGE: Stage = {
  id: "spiral",
  label: "渦巻き", // TODO: 命名は暫定
  // ロの字（ring）の発展＝1周でなく中心まで巻き込む。右折だけで解けるので想定解はロの字と同じ。
  // 道が長く辺長もバラバラ＝ベタ書きも per-leg くりかえしも CP 上限を超え、壁クエリ追従だけが収まる。
  goal: "「前に進む。壁があったら曲がる」をくりかえし、敵の正面まで移動しよう",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  allowedImages: [TURTLE_V3], // 条件分岐＋クエリ（v3）。壁を読んで分岐する応用面。
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: { width: 5, height: 5, walls: SPIRAL_WALLS },
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", pos: { x: 0, y: 0 }, dir: "right", hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 中心 (2,2) で左（x 減）を向く＝正面セルは (1,2)。渦巻きを回り切った ally が (1,2) に立つと自壊する。
      { id: "enemy", pos: { x: 2, y: 2 }, dir: "left", hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
