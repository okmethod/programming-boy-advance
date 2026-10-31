/**
 * ステージ2 定義（インフラ層・TS 定数版）。
 *
 * 盤面を 8x8 に広げ、敵は「近づいたら攻撃・そうでなければ前進」する反応型にする。
 * STAGE_01 の突進型（攻撃しない）との差分でプレイヤーに読解を促す。
 */

import type { Stage } from "$lib/application";
import type { Program } from "$lib/domain";

// 目の前に相手がいれば攻撃、いなければ前進し続ける反応型の敵。
const SENTRY: Program = [
  {
    kind: "repeat",
    count: 100,
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

/** 8x8 の広い盤面。反応型の敵との対戦。 */
export const STAGE_02: Stage = {
  id: "stage-02",
  label: "ステージ2：反応する番人",
  goal: "近づくと攻撃してくる敵を、間合いを読んで先に倒そう",
  enemy: SENTRY,
  enemyLabel: "番人",
  capacity: 25,
  initial: {
    grid: { width: 8, height: 8, walls: [] },
    automatons: [
      { id: "ally", pos: { x: 0, y: 4 }, dir: "right", hp: 3, bp: 0, freezeRemaining: 0, priority: 1 },
      { id: "enemy", pos: { x: 7, y: 4 }, dir: "left", hp: 3, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
