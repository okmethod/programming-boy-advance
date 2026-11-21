import type { Stage } from "#lib/application";
import { BRITTLE_SENTRY, TURTLE_V4 } from "#lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "#lib/infrastructure/stages/chapter1/brittle-enemy";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 6×5 の全マスを使った、ループの無い（通れる辺＝セル数−1）迷路。右手法が入ってしまう「右側の脇道」を置く。
// 脇道の行き止まりでは、右手法が左折を2回くりかえして自然にUターンし、元の道へ戻る＝新しいブロック無しで「迷っても戻れる」。
// 簡略形は行き止まりで「前に進む」が空振りするが、次の周回で向きを変えて同じように抜けられる。
// 壁の役割: 右側の脇道は3つ＝(1,0) から南の区画 (1,1)(1,2)(0,1)〜(0,3)(1,3)（行き止まりは (0,1) と (1,3)）・
// (3,1) から西の (2,1)(2,2)・(2,4) から北の (2,3)〜(4,3)（ゴール目前で長めに寄り道させる）。
// (4,0)〜(5,0) は角の正面の偽の通路（前方だけ見る解を往復させる）。
const MAZE_DEAD_END_MAP = parseStageMap(`
  +---+---+---+---+---+---+
  | A>  .   .   .   .   . |
  +---+   +---+   +---+---+
  | . | . | .   . | .   . |
  +   +   +   +   +   +---+
  | .   . | . | .   .   . |
  +   +---+---+---+---+   +
  | .   . | .   .   . | . |
  +---+---+   +---+---+   +
  | E>  .   .   .   .   . |
  +---+---+---+---+---+---+
`);

export const MAZE_DEAD_END_STAGE: Stage = {
  id: "maze-dead-end",
  label: "迷路 その2", // TODO: 命名は暫定。形状由来（右側に行き止まりの脇道がある迷路）
  // これまでと同じ右手法で抜けられる。右側の脇道に入っても、行き止まりでUターンして戻ってくる様子を観察する面。
  goal: "これまでと同じ手順で迷路を抜けよう。行き止まりに入っても、あわてずに見守ろう",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  allowedImages: [TURTLE_V4], // 周囲認識＋否定（v4）。右手法が行き止まりでUターンする面。
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: MAZE_DEAD_END_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...MAZE_DEAD_END_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 迷路の終点 (1,4) の西隣 (0,4) で東を向く＝正面セルは (1,4)。迷路を抜け切った ally が立つと自壊する。
      { id: "enemy", ...MAZE_DEAD_END_MAP.enemy, hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
