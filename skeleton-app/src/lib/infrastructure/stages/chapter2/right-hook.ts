import type { Stage } from "#lib/application";
import { BRITTLE_SENTRY, TURTLE_V4 } from "#lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "#lib/infrastructure/stages/chapter1/brittle-enemy";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 東→南→西と右折2回で下る階段道の【基本形】（脚長 東2/南2/西2の対称形）。その2・その3 はこの形を伸ばした兄弟面。
// 角1 (2,0) の正面に袋小路ダミー (3,0) を置く＝前が開くので「前が壁なら右折」(v3) は直進して詰まり、
// 右が開いた瞬間に右折する右手センサ(wallRight)だけが通る（角2 (2,2) は盤端で前が塞がり西へ右折する）。
// 脚長が対称なので一様なベタ書きでも解ける＝ベタ書き可の入門面。
// 壁の役割: 上辺 (0,0)(1,0) の南＝右手を壁につけて早すぎる右折を防ぐ／(3,0) の南＝角1の正面の袋小路ダミー／
// (2,2) の東＝西（右折先）へ導く。残りは道の両脇を閉じる壁。
const RIGHT_HOOK_MAP = parseStageMap(`
  +---+---+---+---+
  | A>  .   .   . |
  +---+---+   +---+
  | Ev  . | . | . |
  +   +---+   +   +
  | .   .   . | . |
  +---+---+---+---+
`);

export const RIGHT_HOOK_STAGE: Stage = {
  id: "right-hook",
  label: "右まがり道", // TODO: 命名は暫定。形状由来（右折で下る階段道の基本形）
  // 「右が開いたら右に曲がる、そうでなければ前に進む」をくりかえすと、階段道をなぞって敵の正面に着く。
  // 最初の角の正面は開いている（袋小路ダミー）ので、前方だけ見る v3 では曲がる動機が無く直進して詰まる。
  goal: "右側の壁がないところで右に曲がり、敵の正面まで行こう",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  allowedImages: [TURTLE_V4], // 周囲認識＋否定（v4）。右手センサで「開き」を読む導入面。
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: RIGHT_HOOK_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...RIGHT_HOOK_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 西へ抜けた終点 (0,2) の真上 (0,1) で下を向く＝正面セルは (0,2)。階段道を下り切った ally が立つと自壊する。
      { id: "enemy", ...RIGHT_HOOK_MAP.enemy, hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
