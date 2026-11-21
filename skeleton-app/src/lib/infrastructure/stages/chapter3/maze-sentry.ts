import type { Stage } from "#lib/application";
import type { Program } from "#lib/domain";
import { BASIC_SENTRY, TURTLE_V5 } from "#lib/domain";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 総仕上げ。迷路（Chap2 の壁沿い）と、最下段の通路を往復する見張り（4面目）を組み合わせる。
// 壁沿いのくりかえしの先頭に「敵が前なら攻撃」を置く（CP 8）。置かないと出会っても攻撃せず負ける。
// 見張りとの出会い方（正面か背後か）は、迷路の回り方と出発のタイミングで決まり、プレイヤーが変えられる:
// - 右手法をすぐ出すと、見張りの正面へ入って競り負ける。ループの外側の冒頭で1クロック待つと勝てる（CP 9）。
//   待つ回数で勝ち負けが入れ替わる（HP 8 で勝つのは 1・9・10 回）。
// - 左手法に変えると、待たずに勝てる（残り HP 1）。
// メモリ 24 を刻み 8 で配分させる（HP 8・CP 16 か HP 16・CP 8）。HP 16 を選ぶと、待たずに右手法・左手法のどちらでも
// 正面から押し切れる＝ HP と CP のどちらに振るかを選ぶ面（HP 16 では長い殴り合いで BP のフリーズが起きうる）。

// 最下段の通路を往復し、正面（隣1マス）に来た相手を攻撃する見張り。前が壁なら右折2回で折り返す。
const MAZE_SENTRY_PROGRAM: Program = [
  {
    kind: "while",
    cond: { kind: "literal", value: true },
    body: [
      {
        kind: "if",
        cond: { kind: "sensor", sensor: "enemyAhead" },
        then: [{ kind: "call", cmd: "attack" }],
        else: [
          {
            kind: "if",
            cond: { kind: "sensor", sensor: "wallAhead" },
            then: [
              { kind: "call", cmd: "turnRight" },
              { kind: "call", cmd: "turnRight" },
            ],
            else: [{ kind: "call", cmd: "stepForward" }],
          },
        ],
      },
    ],
  },
];

const MAZE_SENTRY_MAP = parseStageMap(`
  +---+---+---+---+---+---+
  | A>  .   .   . | .   . |
  +---+---+---+   +   +   +
  | .   .   .   .   . | . |
  +   +---+---+---+---+   +
  | .   .   .   .   . | . |
  +---+---+   +---+---+   +
  | E>  .   .   .   .   . |
  +---+---+---+---+---+---+
`);

export const MAZE_SENTRY_STAGE: Stage = {
  id: "maze-sentry",
  label: "迷路の敵", // TODO: 命名は暫定。総仕上げ（迷路＋往復する見張り）
  goal: "迷路の先で見張りが往復している。回り方や出発のタイミングを変えて、見張りとの出会い方を工夫しよう",
  enemy: MAZE_SENTRY_PROGRAM,
  enemyLabel: "歩哨", // TODO: 敵の表示名は暫定
  enemyBaseImage: BASIC_SENTRY,
  allowedImages: [TURTLE_V5],
  memoryTotal: 24, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: MAZE_SENTRY_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...MAZE_SENTRY_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      { id: "enemy", ...MAZE_SENTRY_MAP.enemy, hp: 8, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
