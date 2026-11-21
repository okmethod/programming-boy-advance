import type { Stage } from "#lib/application";
import type { Program } from "#lib/domain";
import { BASIC_SENTRY, TURTLE_V5 } from "#lib/domain";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 見張りが盤の外周16マスを右回りに回り、ally は中央 (2,2) から北を向いて出発する。
// 中央から外周へは北の通路 (2,1)-(2,0) だけでつながる（中央の東西南は壁。内側の U 字は入れない飾り）。
// 壁越しには見えず攻撃も届かないので、中央に留まると見張りは見えない（引き分け）。
// 待ち伏せ: 1歩進んで (2,1) に立ち、外周 (2,0) を通る見張りを待つ。1周に1回しか通らず遅い（113 クロック）。
// 追いかける: 「敵が前なら攻撃・壁なら右折・そうでなければ進む」で外周へ出て右回りに回る。
// 見張りは止まりながら進むので背後に追いつけ、背後からは反撃されない（60 クロック・出口で1発受ける）。
// 左折で回ると見張りと正面から当たり、競り負ける。
// 敵 HP 8 は、外周で見張りを迎え撃つ（行く手をふさぐ）と競り負ける値（6 以下だと迎え撃ちが最速で勝つ）。

// 1歩進むごとに1クロック止まりながら、壁に当たると右折して回る見張り。正面の相手は攻撃を優先する。
// 止まる間は同じマスに2クロック留まる＝背後から追う ally が追いつける。
const CIRCLING_SENTRY_PROGRAM: Program = [
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
            then: [{ kind: "call", cmd: "turnRight" }],
            else: [
              { kind: "call", cmd: "stepForward" },
              { kind: "call", cmd: "wait" },
            ],
          },
        ],
      },
    ],
  },
];

const CIRCLING_SENTRY_MAP = parseStageMap(`
  +---+---+---+---+---+
  | E>  .   .   .   . |
  +   +---+   +---+   +
  | . | . | . | . | . |
  +   +   +   +   +   +
  | . | . | A^| . | . |
  +   +   +---+   +   +
  | . | .   .   . | . |
  +   +---+---+---+   +
  | .   .   .   .   . |
  +---+---+---+---+---+
`);

export const CIRCLING_SENTRY_STAGE: Stage = {
  id: "circling-sentry",
  label: "巡回する敵", // TODO: 命名は暫定。敵のふるまい由来
  goal: "見張りが外側を回っている。待っていると時間がかかる。早く倒す方法を考えよう",
  enemy: CIRCLING_SENTRY_PROGRAM,
  enemyLabel: "歩哨", // TODO: 敵の表示名は暫定
  enemyBaseImage: BASIC_SENTRY,
  allowedImages: [TURTLE_V5],
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: CIRCLING_SENTRY_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...CIRCLING_SENTRY_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      { id: "enemy", ...CIRCLING_SENTRY_MAP.enemy, hp: 8, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
