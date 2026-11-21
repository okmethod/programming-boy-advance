import type { Stage } from "#lib/application";
import { BRITTLE_SENTRY, TURTLE_V1 } from "#lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "#lib/infrastructure/stages/chapter1/brittle-enemy";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 上辺（y=0）→右辺（x=3）の L 字通路を壁で彫る。上辺は x=3 以外で下へ降りられず、右辺は左へ逸れられない。
const L_CURVE_MAP = parseStageMap(`
  +---+---+---+---+
  | A>  .   .   . |
  +---+---+---+   +
  | .   .   . | . |
  +   +   +   +   +
  | .   .   . | . |
  +   +   +   +   +
  | .   .   . | E^|
  +---+---+---+---+
`);

export const L_CURVE_STAGE: Stage = {
  id: "l-curve",
  label: "L字カーブ", // 形状由来の名前。指示（角で向きを変える）は goal に書く
  goal: "角で向きを変えて、敵の正面まで移動しよう",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,
  allowedImages: [TURTLE_V1], // 移動＋向き変えのみ（v1 で解く）。

  initial: {
    grid: L_CURVE_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...L_CURVE_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 上（y 減）を向く＝正面セルは (3,2)。右端の列を下りて正面に立つと自壊する。
      { id: "enemy", ...L_CURVE_MAP.enemy, hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
