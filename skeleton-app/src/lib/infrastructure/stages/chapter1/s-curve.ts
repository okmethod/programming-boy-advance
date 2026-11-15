import type { Stage } from "#lib/application";
import { BRITTLE_SENTRY, TURTLE_V1, wallOn } from "#lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "#lib/infrastructure/stages/chapter1/brittle-enemy";

// 右→下→右の S字通路を壁で彫る。右折と左折を 1 回ずつ要する（L字カーブより曲がりを 1 つ増やす）。
const S_CURVE_WALLS = [
  wallOn({ x: 0, y: 0 }, "down"),
  wallOn({ x: 1, y: 0 }, "down"),
  wallOn({ x: 2, y: 0 }, "right"),
  wallOn({ x: 2, y: 1 }, "right"),
  wallOn({ x: 2, y: 1 }, "left"),
  wallOn({ x: 2, y: 2 }, "left"),
  wallOn({ x: 3, y: 2 }, "up"),
  wallOn({ x: 4, y: 2 }, "up"),
];

export const S_CURVE_STAGE: Stage = {
  id: "s-curve",
  label: "S字カーブ", // 形状由来の名前。指示（右・左と向きを変える）は goal に書く
  goal: "右・左と向きを変えながら進み、敵の正面まで移動しよう",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,
  allowedImages: [TURTLE_V1], // 移動＋向き変えのみ（v1 で解く）。L字カーブ（一回）の次＝向き変えを連ねる練習。

  initial: {
    grid: { width: 5, height: 3, walls: S_CURVE_WALLS },
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", pos: { x: 0, y: 0 }, dir: "right", hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 左（x 減）を向く＝正面セルは (3,2)。右折→左折の S字で (3,2) に立つと自壊する。
      { id: "enemy", pos: { x: 4, y: 2 }, dir: "left", hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
