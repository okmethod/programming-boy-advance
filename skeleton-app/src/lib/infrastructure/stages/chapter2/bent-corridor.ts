import type { Stage } from "#lib/application";
import { BRITTLE_SENTRY, TURTLE_V4 } from "#lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "#lib/infrastructure/stages/chapter1/brittle-enemy";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 右折入門（right-hook）と同じ基本形（(0,0)東→東2→右折、角の正面に袋小路ダミー）で始め、2つ目の角で初めて左折を出す面。
// (2,2) は前も右も壁の行き止まりで左（東）だけ開く＝右折だけのループ（RIGHT_ONLY）はここで詰まり、左折の分岐を足す動機になる。
// 3つ目の角 (4,2) も正面に袋小路ダミー (5,2) を置く＝「前が壁になってから左右を選ぶ」解はダミーへ入って詰まり、右を先に見る右手法だけが通る。
// 最後の角 (4,4) で右折して西へ折り返し、出発点の列の手前 (1,4) まで戻る＝敵は盤の左下に置く。
// 角4つ（右・左・右・右）でベタ書きは CP 上限8を超える＝ループ1本に収める必要がある。
// 壁の役割: 上辺 (0,0)(1,0) の南＝右手を壁につける／(3,0)＝角1の正面の袋小路ダミー／(2,2) の西と南＝左（東）だけ開ける／
// (5,2)＝角3の正面の袋小路ダミー／下辺 (1,4)〜(3,4) の北＝開けると右手法が左下の空き地へ入り込み敵の正面に立てない。残りは道の両脇を閉じる壁。
const BENT_CORRIDOR_MAP = parseStageMap(`
  +---+---+---+---+---+---+
  | A>  .   .   . | .   . |
  +---+---+   +---+   +   +
  | .   . | . | .   .   . |
  +   +   +   +---+---+---+
  | .   . | .   .   .   . |
  +   +   +---+---+   +---+
  | .   .   .   . | . | . |
  +   +---+---+---+   +   +
  | E>  .   .   .   .   . |
  +---+---+---+---+---+---+
`);

export const BENT_CORRIDOR_STAGE: Stage = {
  id: "bent-corridor",
  label: "くねくね道", // TODO: 命名は暫定。形状由来（右・左・右・右と折れる道）
  // 右折入門の縮約形に「前も右も壁なら左折」の分岐を1つ足せば通る。左折は右折と同じ部品（既習の wallAhead・turnLeft）で足りるため、
  // 左折だけの導入面は設けず、この面で初めて出す。ベタ書きは CP 上限8を超えるので、ループ1本に分岐を足す形で解く。
  goal: "右側の壁がないところで右、前が壁のときは左に曲がり、敵の正面まで行こう",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  allowedImages: [TURTLE_V4], // 周囲認識＋否定（v4）。右手センサのループに左折を足す面。
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: BENT_CORRIDOR_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...BENT_CORRIDOR_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 西へ折り返した終点 (1,4) の西隣 (0,4) で東を向く＝正面セルは (1,4)。道を抜け切った ally が立つと自壊する。
      { id: "enemy", ...BENT_CORRIDOR_MAP.enemy, hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
