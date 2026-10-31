/**
 * 妨害する敵のステージ定義（インフラ層・TS 定数版）。
 *
 * 盤面を 4x6 の縦長の矩形にし、敵は近づくと負荷攻撃（DDoS）で過負荷フリーズを狙う妨害型にする。
 * BP（ビジーポイント）管理をプレイヤーに意識させる差分。
 */

import type { Stage } from "$lib/application";
import type { Program } from "$lib/domain";

// 目の前に相手がいれば負荷攻撃で過負荷を狙い、いなければ前進する妨害型の敵。
const DISRUPTOR: Program = [
  {
    kind: "repeat",
    count: 100,
    body: [
      {
        kind: "if",
        cond: { kind: "sensor", sensor: "enemyAhead" },
        then: [{ kind: "call", cmd: "loadAttack" }],
        else: [{ kind: "call", cmd: "stepForward" }],
      },
    ],
  },
];

/** 4x6 の縦長の盤面。上下に対面し、負荷攻撃でフリーズを狙う敵との対戦。 */
export const LOAD_DISRUPTOR_STAGE: Stage = {
  id: "load-disruptor",
  label: "妨害する敵",
  goal: "負荷攻撃でこちらをフリーズさせてくる敵を、過負荷になる前に倒そう",
  enemy: DISRUPTOR,
  enemyLabel: "妨害",
  capacity: 15,
  initial: {
    grid: { width: 4, height: 6, walls: [] },
    automatons: [
      // 縦長盤面なので上下で対面する。ally=上(下向き)／enemy=下(上向き)。
      { id: "ally", pos: { x: 2, y: 0 }, dir: "down", hp: 3, bp: 0, freezeRemaining: 0, priority: 1 },
      { id: "enemy", pos: { x: 2, y: 5 }, dir: "up", hp: 3, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
