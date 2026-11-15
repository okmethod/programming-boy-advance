import type { Stage } from "#lib/application";
import { BRITTLE_SENTRY, TURTLE_V1 } from "#lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "#lib/infrastructure/stages/chapter1/brittle-enemy";

export const STRAIGHT_CORRIDOR_STAGE: Stage = {
  id: "straight-corridor",
  label: "一本道", // 形状由来の名前。指示は goal に書く（高さ1＝元から幅1の一本道で壁は不要）
  goal: "前に進んで、敵の正面まで移動しよう（この敵は、正面に立たれると自壊する）",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,
  allowedImages: [TURTLE_V1], // 移動のみ。制御・攻撃は持たせない（v1 で解く導入面）。

  initial: {
    grid: { width: 6, height: 1, walls: [] },
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", pos: { x: 0, y: 0 }, dir: "right", hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 左を向く＝正面セルは (4,0)。プレイヤーがそこへ到達した瞬間、brittleAttack が暴発して自壊する。
      { id: "enemy", pos: { x: 5, y: 0 }, dir: "left", hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
