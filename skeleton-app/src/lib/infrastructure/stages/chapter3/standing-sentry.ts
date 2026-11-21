import type { Stage } from "#lib/application";
import type { Program } from "#lib/domain";
import { BASIC_SENTRY, TURTLE_V5 } from "#lib/domain";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 攻撃される脅威の初出。盤面は「動かない的」と同じで、敵だけが正面の相手を攻撃する見張りに替わる。
// 正面に入ったクロックに先に1発受けるが、以降は ally が先手（priority）なので、HP 8 対 4 で競り勝てる（残り HP 4）。

// 立ち止まったまま、正面（隣1マス）に来た相手を攻撃し続ける見張り（while(true){ if 敵が前 then 攻撃 else 待機 }）。
const STANDING_SENTRY_PROGRAM: Program = [
  {
    kind: "while",
    cond: { kind: "literal", value: true },
    body: [
      {
        kind: "if",
        cond: { kind: "sensor", sensor: "enemyAhead" },
        then: [{ kind: "call", cmd: "attack" }],
        else: [{ kind: "call", cmd: "wait" }],
      },
    ],
  },
];

const STANDING_SENTRY_MAP = parseStageMap(`
  +---+---+---+---+---+
  | A>  .   .   .   E<|
  +---+---+---+---+---+
`);

export const STANDING_SENTRY_STAGE: Stage = {
  id: "standing-sentry",
  label: "待ち構える敵", // TODO: 命名は暫定。敵のふるまい由来
  goal: "見張りは正面に来た相手を攻撃してくる。攻撃しあって、先に倒そう",
  enemy: STANDING_SENTRY_PROGRAM,
  enemyLabel: "歩哨", // TODO: 敵の表示名は暫定
  enemyBaseImage: BASIC_SENTRY,
  allowedImages: [TURTLE_V5],
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: STANDING_SENTRY_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...STANDING_SENTRY_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // HP 8 の ally が殴り合いで競り勝てる値（7 までは勝ち、8 以上は負け。自分から正面に入るので見張りが先に1発入れる）。
      { id: "enemy", ...STANDING_SENTRY_MAP.enemy, hp: 4, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
