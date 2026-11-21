import type { Stage } from "#lib/application";
import type { Program } from "#lib/domain";
import { BASIC_SENTRY, TURTLE_V5 } from "#lib/domain";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 盤面は「回る見張り」と同じで、見張りが止まらずに回る点だけが違う（敵の速さだけで前の面の正解が通じなくなる面）。
// 見張りは盤の外周16マスを右回りに回り、ally は中央 (2,2) から北を向いて出発する（外周へは北の通路だけでつながる）。
// 右回りに追いかける（前の面の解）: 同じ速さなので追いつけず引き分け。
// 1歩出て待ち伏せる: 1周に1発しか当たらず遅い（143 クロック）。
// 左回りで迎え撃つ: すぐ出ると自分から見張りの正面に入って競り負ける。
// 1クロック待ってから出ると、見張りの方が正面に入ってくる＝ ally が先手を取って競り勝つ（20 クロック・残り HP 2・CP 7）。
// 2回待っても勝つが、3〜4回だと再び自分から正面に入って負ける。

// 正面（隣1マス）に相手がいれば攻撃、壁なら右折、そうでなければ進む（止まらずに右回りする）見張り。
const NONSTOP_CIRCLING_SENTRY_PROGRAM: Program = [
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
            else: [{ kind: "call", cmd: "stepForward" }],
          },
        ],
      },
    ],
  },
];

const NONSTOP_CIRCLING_SENTRY_MAP = parseStageMap(`
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

export const NONSTOP_CIRCLING_SENTRY_STAGE: Stage = {
  id: "nonstop-circling-sentry",
  label: "巡回する敵 その2", // TODO: 命名は暫定。敵のふるまい由来
  goal: "見張りが止まらずに外側を回っている。追いかけても追いつけない。向かい合って先に攻撃しよう",
  enemy: NONSTOP_CIRCLING_SENTRY_PROGRAM,
  enemyLabel: "歩哨", // TODO: 敵の表示名は暫定
  enemyBaseImage: BASIC_SENTRY,
  allowedImages: [TURTLE_V5],
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: NONSTOP_CIRCLING_SENTRY_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...NONSTOP_CIRCLING_SENTRY_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 迎え撃ちで、先手を取れば勝ち・取られれば負けになる値（6 以下だと、すぐ出て迎え撃っても勝ててしまう）。
      { id: "enemy", ...NONSTOP_CIRCLING_SENTRY_MAP.enemy, hp: 8, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
