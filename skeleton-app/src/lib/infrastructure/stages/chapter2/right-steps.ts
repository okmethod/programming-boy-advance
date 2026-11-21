import type { Stage } from "#lib/application";
import { BRITTLE_SENTRY, TURTLE_V4 } from "#lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "#lib/infrastructure/stages/chapter1/brittle-enemy";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// right-hook（基本形）を縦に1マス伸ばした兄弟面（南の脚だけ 2→3 に延び、脚長 東2/南3/西2 の非対称形になる）。
// 脚長がばらばらなので「Nマス進んで右折」の一様なくりかえしは効かない（曲がる位置がずれて詰まる）。
// 脚別のベタ書き（くりかえしN{前}＋向き変え）なら CP 上限8に収まる＝まだベタ書き可。
// 狙い＝右手センサ解(RIGHT_ONLY)は脚長に依らず効く利点を体感させ、ベタ書きが破綻する その3 への橋渡し。
// 角1の正面ダミー (3,0) で「前が壁なら右折」(v3) の直進を失敗させ、右手センサ(wallRight)を必須にする。
// 壁の役割: 上辺 (0,0)(1,0) の南＝右手を壁につける／(3,0) の南＝角1の正面の袋小路ダミー／
// (2,3) の東＝西（右折先）へ導く。残りは道の両脇を閉じる壁。
const RIGHT_STEPS_MAP = parseStageMap(`
  +---+---+---+---+
  | A>  .   .   . |
  +---+---+   +---+
  | .   . | . | . |
  +   +   +   +   +
  | Ev  . | . | . |
  +   +---+   +   +
  | .   .   . | . |
  +---+---+---+---+
`);

export const RIGHT_STEPS_STAGE: Stage = {
  id: "right-steps",
  label: "右まがり道 その2", // TODO: 命名は暫定。形状由来（基本形を縦に伸ばし脚長を崩した右折の階段道）
  // right-hook と同じ右手センサ解がそのまま効く。脚長が不揃いなので一様なベタ書きループは効かない。
  goal: "右側の壁がないところで右に曲がり、敵の正面まで行こう",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  allowedImages: [TURTLE_V4], // 周囲認識＋否定（v4）。右手センサ解を非対称な道へ適用する面。
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: RIGHT_STEPS_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...RIGHT_STEPS_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 西へ抜けた終点 (0,3) の真上 (0,2) で下を向く＝正面セルは (0,3)。道を下り切った ally が立つと自壊する。
      { id: "enemy", ...RIGHT_STEPS_MAP.enemy, hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
