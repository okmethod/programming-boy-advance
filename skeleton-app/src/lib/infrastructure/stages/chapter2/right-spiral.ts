import type { Stage } from "#lib/application";
import { BRITTLE_SENTRY, TURTLE_V4 } from "#lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "#lib/infrastructure/stages/chapter1/brittle-enemy";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// その2（東2/南3/西2）の終点 (0,3) を角に変え、そこから北へ巻き上げる兄弟面（右折が3回になる・脚長 東2/南3/西2/北1）。
// 壁配置は right-steps と同一で、敵を1マス上 (0,2→0,1) へ置いて (0,3) を通過点にし、3折り目（北）を強制する。
// 右折だけで内へ巻き込む渦巻き。隣り合う脚の長さが等しくないので一様なベタ書きは効かず、
// 脚別ベタ書きも 4脚＋右折3回＝10ブロックで CP 上限8を超える＝ベタ書きでは畳めない。
// 右が開けば右折するループ1本（RIGHT_ONLY＝4ブロック）だけが上限に収まる＝ループを強制する面。
// 角1の正面ダミー (3,0) で「前が壁なら右折」(v3) の直進を失敗させる。
// 壁の役割: 上辺 (0,0)(1,0) の南＝右手を壁につける／(3,0) の南＝角1の正面の袋小路ダミー／
// (2,3) の東＝西（右折先）へ導く。残りは道の両脇を閉じる壁。
const RIGHT_SPIRAL_MAP = parseStageMap(`
  +---+---+---+---+
  | A>  .   .   . |
  +---+---+   +---+
  | Ev  . | . | . |
  +   +   +   +   +
  | .   . | . | . |
  +   +---+   +   +
  | .   .   . | . |
  +---+---+---+---+
`);

export const RIGHT_SPIRAL_STAGE: Stage = {
  id: "right-spiral",
  label: "右まがり道 その3", // TODO: 命名は暫定。形状由来（その2を角にして北へ巻き上げる渦巻き）
  // 覚えた右手センサのループがそのまま効く。脚長がばらばらで道が長いので、ベタ書きは CP 上限に収まらない。
  goal: "右側の壁がないところで右に曲がり、敵の正面まで行こう",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  allowedImages: [TURTLE_V4], // 周囲認識＋否定（v4）。右手センサのループを強制する面。
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: RIGHT_SPIRAL_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...RIGHT_SPIRAL_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 北へ巻き上げた終点 (0,2) の真上 (0,1) で下を向く＝正面セルは (0,2)。渦を巻き切った ally が立つと自壊する。
      { id: "enemy", ...RIGHT_SPIRAL_MAP.enemy, hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
