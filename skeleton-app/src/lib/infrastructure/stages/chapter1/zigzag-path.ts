import type { Stage } from "#lib/application";
import { BRITTLE_SENTRY, TURTLOGO_V1, wallOn } from "#lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "#lib/infrastructure/stages/chapter1/brittle-enemy";

// 4x4 の盤面を九十九折りにする辺壁。各行境界を1列だけ開けて一本道にする。
// 行0→1 は x=3 のみ開通、行1→2 は x=0 のみ、行2→3 は x=3 のみ。
const MAZE_WALLS = [
  wallOn({ x: 0, y: 0 }, "down"),
  wallOn({ x: 1, y: 0 }, "down"),
  wallOn({ x: 2, y: 0 }, "down"),
  wallOn({ x: 1, y: 1 }, "down"),
  wallOn({ x: 2, y: 1 }, "down"),
  wallOn({ x: 3, y: 1 }, "down"),
  wallOn({ x: 0, y: 2 }, "down"),
  wallOn({ x: 1, y: 2 }, "down"),
  wallOn({ x: 2, y: 2 }, "down"),
];

export const ZIGZAG_PATH_STAGE: Stage = {
  id: "zigzag-path",
  label: "ジグザグ道",
  goal: "壁に沿って進み、奥の敵の正面に立とう",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  memoryTotal: 24, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,
  allowedImages: [TURTLOGO_V1], // 移動＋向き変えの連鎖のみ（v1 で解く）。

  initial: {
    grid: { width: 4, height: 4, walls: MAZE_WALLS },
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", pos: { x: 0, y: 0 }, dir: "right", hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 上（y 減）を向く＝正面セルは (3,2)。プレイヤーがそこへ到達した瞬間、brittleAttack が暴発して自壊する。
      // HP は暴発で 0 になるので初期値は 1（生存していればよい）。
      { id: "enemy", pos: { x: 3, y: 3 }, dir: "up", hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
