import type { Stage } from "$lib/application";
import { BRITTLE_SENTRY } from "$lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "$lib/infrastructure/stages/chapter1/brittle-enemy";

export const LONG_CORRIDOR_STAGE: Stage = {
  id: "long-corridor",
  label: "長い一本道",
  goal: "くりかえしを使って、いちばん奥の敵の正面まで進もう",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  // CP 上限＝memoryTotal−memoryGrain＝8（HP に 1 目盛り残す）＝直進ベタ書き（10 歩）が収まらず、
  // くりかえし（repeat/while＝v2 の制御・2 CP）に手を伸ばさせる＝CP の壁で v2 を動機づける。
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: { width: 12, height: 1, walls: [] },
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", pos: { x: 0, y: 0 }, dir: "right", hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 左を向く＝正面セルは (10,0)。前進を 10 回くりかえすと到達＝自壊。repeat は壁/敵で止まるので回数は多めでも成立する。
      { id: "enemy", pos: { x: 11, y: 0 }, dir: "left", hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
