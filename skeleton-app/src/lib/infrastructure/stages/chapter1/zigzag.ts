import type { Stage } from "#lib/application";
import { BRITTLE_SENTRY, TURTLE_V2 } from "#lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "#lib/infrastructure/stages/chapter1/brittle-enemy";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 右へ1歩→下へ1歩を繰り返すジグザグの一本道（幅1の廊下）。壁で各セルの脇道を塞ぐ。
// 想定解＝「前進・右折・前進・左折」をくりかえす＝向き変えを含む本体をループさせる練習。
const ZIGZAG_MAP = parseStageMap(`
  +---+---+---+---+
  | A>  . | .   . |
  +---+   +---+   +
  | . | .   . | . |
  +   +---+   +---+
  | .   . | .   . |
  +   +   +---+   +
  | .   .   . | E^|
  +---+---+---+---+
`);

export const ZIGZAG_STAGE: Stage = {
  id: "zigzag",
  label: "ジグザグ道",
  // CP 上限＝8。ジグザグのベタ書き（前進5＋向き変え4＝9）は収まらず、向き変えを含む本体の
  // くりかえし（repeat＝v2）に手を伸ばさせる＝長い一本道に続けて repeat を向き変え込みで使わせる。
  goal: "ジグザグ移動をくりかえし、奥の敵の正面まで移動しよう",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  allowedImages: [TURTLE_V2], // くりかえし（v2）。センサ・攻撃は持たせない（repeat で解く）。
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: ZIGZAG_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...ZIGZAG_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 上（y 減）を向く＝正面セルは (3,2)。ジグザグを登り切って (3,2) に立つと自壊する。
      { id: "enemy", ...ZIGZAG_MAP.enemy, hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
