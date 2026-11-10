import type { Stage } from "$lib/application";
import { BRITTLE_SENTRY, TURTLOGO_V1 } from "$lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "$lib/infrastructure/stages/chapter1/brittle-enemy";

export const CORNER_TURN_STAGE: Stage = {
  id: "corner-turn",
  label: "角を曲がる",
  goal: "角で向きを変えて、敵の正面に移動しよう",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,
  allowedImages: [TURTLOGO_V1], // 移動＋向き変えのみ（v1 で解く）。

  initial: {
    // 壁は無いが、移動は前方1マスのみ＝斜めに詰められず、敵は直進線上に居ないので turn が要る L 字。
    grid: { width: 4, height: 4, walls: [] },
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", pos: { x: 0, y: 0 }, dir: "right", hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 上（y 減）を向く＝正面セルは (3,2)。右端の列を下りて正面に立つと自壊する。
      { id: "enemy", pos: { x: 3, y: 3 }, dir: "up", hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
