import type { Stage } from "#lib/application";
import { BRITTLE_SENTRY, TURTLE_V4 } from "#lib/domain";
import { BRITTLE_ENEMY_LABEL, BRITTLE_ENEMY_PROGRAM } from "#lib/infrastructure/stages/chapter1/brittle-enemy";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 8×6 の全マスを使った、ループの無い（通れる辺＝セル数−1）本格的な迷路。分岐は7か所。
// 迷路を自動生成し、右手法で抜けられる／前方だけ見る解などは抜けられない／右手法が盤の右端まで行く、という条件で選んだ形。
// 敵は盤の端でなく迷路の奥 (2,4) にいる。右手法は盤の約9割を通り、行き止まり（(0,1)・(0,4)・(6,2)・(7,0) など）で5回Uターンする
// ＝迷路 その2 で見た寄り道を、盤全体で繰り返す総仕上げ。
// 左手法でも抜けられ、この面では右手法より速い（右 94・左 63 クロック）＝迷路 その4 の「手を変えると結果が変わる」への伏線。
const MAZE_BRANCHES_MAP = parseStageMap(`
  +---+---+---+---+---+---+---+---+
  | A>  . | . | .   .   .   . | . |
  +---+   +   +   +   +---+   +   +
  | . | . | .   . | .   . | .   . |
  +   +   +   +---+---+   +---+   +
  | .   . | . | . | .   . | .   . |
  +   +---+   +   +   +---+---+---+
  | .   . | .   . | .   .   .   . |
  +---+   +   +---+---+   +---+   +
  | . | . | E^| .   . | .   . | . |
  +   +   +---+   +   +---+---+   +
  | .   .   .   . | .   .   .   . |
  +---+---+---+---+---+---+---+---+
`);

export const MAZE_BRANCHES_STAGE: Stage = {
  id: "maze-branches",
  label: "迷路 その3", // TODO: 命名は暫定。形状由来（分岐の多い本格的な迷路）
  // これまでと同じ右手法で抜けられる。盤が広がり分岐と行き止まりが増えても、同じプログラムのまま全体を探って抜ける。
  goal: "大きな迷路も、これまでと同じ手順で抜けて、敵の正面まで行こう",
  enemy: BRITTLE_ENEMY_PROGRAM,
  enemyLabel: BRITTLE_ENEMY_LABEL,
  enemyBaseImage: BRITTLE_SENTRY,
  allowedImages: [TURTLE_V4], // 周囲認識＋否定（v4）。右手法を本格的な迷路へ適用する面。
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: MAZE_BRANCHES_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...MAZE_BRANCHES_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 迷路の奥の終点 (2,3) の真下 (2,4) で上を向く＝正面セルは (2,3)。迷路を抜け切った ally が立つと自壊する。
      { id: "enemy", ...MAZE_BRANCHES_MAP.enemy, hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
