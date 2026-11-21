import type { Stage } from "#lib/application";
import { BRITTLE_SENTRY, TURTLE_V2 } from "#lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "#lib/infrastructure/stages/chapter1/brittle-enemy";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 4x5 の盤面を折り返し道（各行を往復する U字ターンの連なり）にする辺壁。各行境界を1列だけ開けて一本道にする。
// 行0→1 は x=3 のみ開通、行1→2 は x=0 のみ、行2→3 は x=3 のみ、行3→4 は x=0 のみ。
const SWITCHBACK_MAP = parseStageMap(`
  +---+---+---+---+
  | A>  .   .   . |
  +---+---+---+   +
  | .   .   .   . |
  +   +---+---+---+
  | .   .   .   . |
  +---+---+---+   +
  | .   .   .   . |
  +   +---+---+---+
  | .   .   .   E<|
  +---+---+---+---+
`);

export const SWITCHBACK_STAGE: Stage = {
  id: "switchback",
  label: "つづら折り道",
  // ジグザグ道の発展＝折り返し（右・左の U字）を含む2行ぶんを1単位にして while で回す。
  // 本体が長く右折・左折も混ざるが、規則的なので高さに依らず同じ本体を回せる（想定解 13 CP）。
  goal: "折り返しをくりかえし、奥の敵の正面まで移動しよう",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  allowedImages: [TURTLE_V2], // くりかえし（v2）。センサ・攻撃は持たせない（while で解く）。
  memoryTotal: 24, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: SWITCHBACK_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...SWITCHBACK_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 左（x 減）を向く＝正面セルは (2,4)。折り返しを下りきった最下段で (2,4) に到達した瞬間、
      // brittleAttack が暴発して自壊する。HP は暴発で 0 になるので初期値は 1（生存していればよい）。
      { id: "enemy", ...SWITCHBACK_MAP.enemy, hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
