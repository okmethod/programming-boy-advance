import type { Stage } from "#lib/application";
import type { Program } from "#lib/domain";
import { BASIC_SENTRY, TURTLE_V5 } from "#lib/domain";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 待ち構えて先手を取る面。盤面は「動かない的」と同じで、見張りがこちらへ向かってくる。
// 同じクロックでは ally の行動が先に解決される（priority）ため、正面に入った側が先に1発受ける。
// 自分から進むと正面に入るのは ally（先に1発受けて HP 8 対 8 で競り負ける）、
// その場で待てば正面に入るのは見張り（ally が先に1発入れて残り HP 1 で競り勝つ）。

// 正面（隣1マス）に相手がいれば攻撃、いなければ前進し続ける見張り（while(true){ if 敵が前 then 攻撃 else 進む }）。
const APPROACHING_SENTRY_PROGRAM: Program = [
  {
    kind: "while",
    cond: { kind: "literal", value: true },
    body: [
      {
        kind: "if",
        cond: { kind: "sensor", sensor: "enemyAhead" },
        then: [{ kind: "call", cmd: "attack" }],
        else: [{ kind: "call", cmd: "stepForward" }],
      },
    ],
  },
];

const APPROACHING_SENTRY_MAP = parseStageMap(`
  +---+---+---+---+---+
  | A>  .   .   .   E<|
  +---+---+---+---+---+
`);

export const APPROACHING_SENTRY_STAGE: Stage = {
  id: "approaching-sentry",
  label: "迫り来る敵", // TODO: 命名は暫定。敵のふるまい由来
  goal: "見張りがこちらへ向かってくる。先に攻撃できるのはどちらか、考えて迎え撃とう",
  enemy: APPROACHING_SENTRY_PROGRAM,
  enemyLabel: "歩哨", // TODO: 敵の表示名は暫定
  enemyBaseImage: BASIC_SENTRY,
  allowedImages: [TURTLE_V5],
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: APPROACHING_SENTRY_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...APPROACHING_SENTRY_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 先手の1発で勝敗が入れ替わる値（7 以下だと進んでも勝て、9 以上だと待っても負ける）。
      { id: "enemy", ...APPROACHING_SENTRY_MAP.enemy, hp: 8, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
