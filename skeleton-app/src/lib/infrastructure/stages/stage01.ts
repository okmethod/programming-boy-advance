/**
 * ステージ定義データ（インフラ層・TS 定数版の供給元）。
 *
 * コンテンツ定義方式（TS/JSON/YAML+DSL）は後から移行可能な前提（docs/design/README.md）。
 * 現状は TS 定数で持ち、StageRepository の Adapter からのみ参照される。
 */

import type { Stage } from "$lib/application";
import type { Program } from "$lib/domain";

// まっすぐ突進し続けるだけの敵（攻撃しない）。
const CHARGER: Program = [{ kind: "repeat", count: 100, body: [{ kind: "call", cmd: "stepForward" }] }];

/** 縦スライス検証用の単一ステージ。F2a では 1 枚だけ用意する。 */
export const STAGE_01: Stage = {
  id: "stage-01",
  label: "ステージ1：突進する敵",
  goal: "まっすぐ突進してくる敵を、近づいたら攻撃して倒そう",
  enemy: CHARGER,
  enemyLabel: "突進",
  capacity: 20,
  initial: {
    grid: { width: 7, height: 3, walls: [] },
    automatons: [
      // priority はプレイヤー（ally）を高くして先手固定。bp/freezeRemaining は 0 から始まる。
      { id: "ally", pos: { x: 0, y: 1 }, dir: "right", hp: 3, bp: 0, freezeRemaining: 0, priority: 1 },
      { id: "enemy", pos: { x: 6, y: 1 }, dir: "left", hp: 3, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
