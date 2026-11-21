import type { Stage } from "#lib/application";
import { BRITTLE_SENTRY, TURTLE_V4 } from "#lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "#lib/infrastructure/stages/chapter1/brittle-enemy";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 6×5 の全マスを使った、ループの無い（通れる辺＝セル数−1）ほぼ一本道の迷路。
// 道筋は盤の中を行き来し（左上→中央を北上→右側→中央下→左下の敵）、右折と左折がほぼ半々で15回ほど曲がる。
// 脇道はすべて「右折する角の正面」に置いた行き止まりで、右を先に見る右手法は入らない＝Uターンを覚えなくても抜けられる。
// 前方だけ見る解（v3）や「前が壁になってから左右を選ぶ」解は、脇道に入って抜け出せない。
// 壁の役割: 脇道は (4,0)〜(5,0)（上段で東へ続く偽の通路）・(5,3)〜(4,3)・(3,4)〜(5,4) の3本。残りは一本道の両脇を閉じる壁。
const MAZE_CORRIDOR_MAP = parseStageMap(`
  +---+---+---+---+---+---+
  | A>  . | .   .   .   . |
  +---+   +   +   +---+---+
  | .   . | . | .   .   . |
  +   +---+   +---+---+   +
  | . | .   . | .   .   . |
  +   +   +---+   +---+   +
  | .   . | .   . | .   . |
  +---+---+   +   +---+---+
  | E>  .   . | .   .   . |
  +---+---+---+---+---+---+
`);

export const MAZE_CORRIDOR_STAGE: Stage = {
  id: "maze-corridor",
  label: "迷路", // TODO: 命名は暫定。形状由来（盤の全マスを使った、ほぼ一本道の迷路）
  // くねくね道で覚えた右手法（簡略形・フル形）がそのまま効く。脇道は右手法が入らない位置にだけ置いている。
  goal: "これまでと同じ手順で迷路を抜けて、敵の正面まで行こう",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  allowedImages: [TURTLE_V4], // 周囲認識＋否定（v4）。右手法を迷路へ適用する面。
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: MAZE_CORRIDOR_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...MAZE_CORRIDOR_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 迷路の終点 (1,4) の西隣 (0,4) で東を向く＝正面セルは (1,4)。迷路を抜け切った ally が立つと自壊する。
      { id: "enemy", ...MAZE_CORRIDOR_MAP.enemy, hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
