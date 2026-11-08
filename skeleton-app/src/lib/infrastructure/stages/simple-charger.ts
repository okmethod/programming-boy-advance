/**
 * ステージ定義データ（インフラ層・TS 定数版の供給元）。
 *
 * StageRepository の Adapter からのみ参照される（供給元の切替は Port で吸収する）。
 */

import type { Stage } from "$lib/application";
import type { Program } from "$lib/domain";
import { TURTLOGO_V2 } from "$lib/domain";

// まっすぐ突進し続けるだけの敵（攻撃しない）。
const CHARGER: Program = [{ kind: "repeat", count: 100, body: [{ kind: "call", cmd: "stepForward" }] }];

/** 突進する敵のステージ（攻撃しない単純型）。 */
export const SIMPLE_CHARGER_STAGE: Stage = {
  // id は順序非依存の不変ハンドル（URL 同一性）。表示番号は並び順から導き id には載せない。
  id: "simple-charger",
  label: "突進する敵",
  goal: "まっすぐ突進してくる敵を、近づいたら攻撃して倒そう",
  enemy: CHARGER,
  enemyLabel: "突進",
  enemyBaseImage: TURTLOGO_V2,
  capacity: 16, // STEP=8 の倍数（CapacityAllocator の invariant）

  initial: {
    grid: { width: 7, height: 3, walls: [] },
    automatons: [
      // priority はプレイヤー（ally）を高くして先手固定。bp/freezeRemaining は 0 から始まる。
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は capacity から配分した個体値で上書きされる。
      { id: "ally", pos: { x: 0, y: 1 }, dir: "right", hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      { id: "enemy", pos: { x: 6, y: 1 }, dir: "left", hp: 3, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
