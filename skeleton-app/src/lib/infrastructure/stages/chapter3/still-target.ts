import type { Stage } from "#lib/application";
import type { Program } from "#lib/domain";
import { BASIC_SENTRY, TURTLE_V5 } from "#lib/domain";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 攻撃の入門面。的は動かず反撃もしないので、正面まで進んで HP を削り切れば勝てる。
// 「敵が前なら攻撃、いなければ進む」のくりかえしでも、「進む×3 → 攻撃のくりかえし」のベタ書きでも解ける。

// 何もしない的（while(true){ wait }）。自壊も反撃もしない＝HP を攻撃で削り切るしか勝ち筋がない。
const STILL_TARGET_PROGRAM: Program = [
  { kind: "while", cond: { kind: "literal", value: true }, body: [{ kind: "call", cmd: "wait" }] },
];

const STILL_TARGET_MAP = parseStageMap(`
  +---+---+---+---+---+
  | A>  .   .   .   E<|
  +---+---+---+---+---+
`);

export const STILL_TARGET_STAGE: Stage = {
  id: "still-target",
  label: "動かない敵", // TODO: 命名は暫定。敵のふるまい由来
  goal: "敵の正面まで進んで、攻撃で倒そう",
  enemy: STILL_TARGET_PROGRAM,
  enemyLabel: "寝ぼけた歩哨", // TODO: 敵の表示名は暫定
  enemyBaseImage: BASIC_SENTRY,
  allowedImages: [TURTLE_V5], // 攻撃（v5）の導入面。
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: STILL_TARGET_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...STILL_TARGET_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 攻撃1回で倒れない HP＝くりかえし攻撃する動機を作る。
      { id: "enemy", ...STILL_TARGET_MAP.enemy, hp: 4, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
