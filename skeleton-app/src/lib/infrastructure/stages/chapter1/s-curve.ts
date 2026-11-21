import type { Stage } from "#lib/application";
import { BRITTLE_SENTRY, TURTLE_V1 } from "#lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "#lib/infrastructure/stages/chapter1/brittle-enemy";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 右→下→右の S字通路を壁で彫る。右折と左折を 1 回ずつ要する（L字カーブより曲がりを 1 つ増やす）。
const S_CURVE_MAP = parseStageMap(`
  +---+---+---+---+---+
  | A>  .   . | .   . |
  +---+---+   +   +   +
  | .   . | . | .   . |
  +   +   +   +---+---+
  | .   . | .   .   E<|
  +---+---+---+---+---+
`);

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
    grid: S_CURVE_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...S_CURVE_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 左（x 減）を向く＝正面セルは (3,2)。右折→左折の S字で (3,2) に立つと自壊する。
      { id: "enemy", ...S_CURVE_MAP.enemy, hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
