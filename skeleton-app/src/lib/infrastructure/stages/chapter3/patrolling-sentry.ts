import type { Stage } from "#lib/application";
import type { Program } from "#lib/domain";
import { BASIC_SENTRY, TURTLE_V5 } from "#lib/domain";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 通路を往復し、正面（隣1マス）に来た相手を攻撃する見張り。前が壁なら右折2回で折り返す。
// 正面の相手への攻撃を移動より優先する＝通路に割り込んで行く手をふさぐと攻撃される。
const PATROLLING_SENTRY_PROGRAM: Program = [
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

// 下段の通路を見張りが往復する。ally は上段のくぼみ (2,0) から通路の方（南）を向いて出発する。
// 見張りは進行方向（東西）しか見ないので、くぼみで待ち、正面 (2,1) を通る瞬間に攻撃すれば反撃されない
// （1回の通過で1発・往復で2発ずつ削る）。
// 敵 HP 8 は ally（HP 8）が正面の殴り合いで負ける値＝通路に出て行く手をふさぐ・正面から迎え撃つ・
// 背後から追いかけて折り返しを叩く、のいずれも負け、待ち伏せだけが勝つ（7 以下だと迎え撃ちで勝ててしまう）。
// 上段のくぼみ以外のマスは入れない飾り（盤を長方形に保つため）。
const PATROLLING_SENTRY_MAP = parseStageMap(`
  +---+---+---+---+---+
  | .   . | Av| .   . |
  +---+---+   +---+---+
  | E>  .   .   .   . |
  +---+---+---+---+---+
`);

export const PATROLLING_SENTRY_STAGE: Stage = {
  id: "patrolling-sentry",
  label: "往復する敵", // TODO: 命名は暫定。敵のふるまい由来
  goal: "見張りは正面の相手を攻撃しながら通路を往復している。正面から戦わずに倒す方法を考えよう",
  enemy: PATROLLING_SENTRY_PROGRAM,
  enemyLabel: "歩哨", // TODO: 敵の表示名は暫定
  enemyBaseImage: BASIC_SENTRY,
  allowedImages: [TURTLE_V5],
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: PATROLLING_SENTRY_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...PATROLLING_SENTRY_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      { id: "enemy", ...PATROLLING_SENTRY_MAP.enemy, hp: 8, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
