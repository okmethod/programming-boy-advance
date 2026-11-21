import type { Stage } from "#lib/application";
import { BRITTLE_SENTRY, TURTLE_V4 } from "#lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "#lib/infrastructure/stages/chapter1/brittle-enemy";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 8×6 の迷路に輪を1つだけ作り、輪の内側の壁を外周とつながらない「島」にした面（迷路を自動生成し、条件で選んだ形）。
// 右手法は最初に右手で触れた壁をたどり続けるので、島を右手にして出発すると島の周りを回り続け、敵に届かない
// ＝これまでの手順が通じない場面で、動かす→観察する→原因を考えて直す、という開発の流れを体験させる最終面。
// 右手法が回る輪（18マス）: (3,4) から東へ (6,4)→最下段を西へ (0,5)→(0,4)→(1,4)〜(1,2)→(2,2)〜(2,4)→出発点。毎周、盤の下側を大きく横切る。
// 直し方の例: 左右を入れ替えた左手法（外周側の壁をたどり、左の列を北へ上がって左上の敵に届く）／
// 最初に右折2回でUターンしてから右手法（外周側の壁が右手になる・簡略形と合わせて CP 8）。
// 出発点を盤の内側にしたのは、盤の隅から出ると右手法が必ず外周の壁をたどり、島に捕まらないため。
const MAZE_ISLAND_MAP = parseStageMap(`
  +---+---+---+---+---+---+---+---+
  | E>  . | .   .   .   .   .   . |
  +---+   +   +---+---+   +   +---+
  | . | . | . | .   . | . | .   . |
  +   +   +---+   +   +---+---+   +
  | . | .   .   . | . | .   .   . |
  +   +   +   +---+   +   +---+   +
  | . | . | . | .   .   . | .   . |
  +   +   +   +---+---+---+---+   +
  | .   . | .   A>  .   .   . | . |
  +   +---+---+---+---+---+   +   +
  | .   .   .   .   .   .   . | . |
  +---+---+---+---+---+---+---+---+
`);

export const MAZE_ISLAND_STAGE: Stage = {
  id: "maze-island",
  label: "迷路 その4", // TODO: 命名は暫定。形状由来（右手法が回り続ける島のある迷路）
  // これまでの右手法では島の周りを回り続ける。動きを観察し、左手法にする・最初に向きを変える等で直す面。
  // TODO: goal の文言は暫定（失敗を前提に観察を促す方向。ヒントの出しすぎで自分で気づく体験を薄めないよう要調整）
  goal: "いつもの手順で出撃してみよう。うまくいかないときは、動きをよく見て直そう",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  allowedImages: [TURTLE_V4], // 周囲認識＋否定（v4）。右手法が通じない迷路を、観察して直す面。
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: MAZE_ISLAND_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...MAZE_ISLAND_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 左上の隅 (0,0) で東を向く＝正面セルは (1,0)。島から抜け出して北へ上がり切った ally が立つと自壊する。
      { id: "enemy", ...MAZE_ISLAND_MAP.enemy, hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
