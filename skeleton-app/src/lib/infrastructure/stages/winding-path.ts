/**
 * 曲がりくねった小道のステージ定義（インフラ層・TS 定数版）。
 *
 * 辺壁（セル間の壁）で作ったサーペンタイン（九十九折り）の一本道を導入する。
 * 各行は 1 箇所でしか隣の行へ繋がらないため、迷路を順にたどる移動課題になる。
 * 現状は的（動かない敵）を奥に置く移動デモ。将来の Chap1 では敵を brittleAttack の脆弱型に差し替える。
 */

import type { Stage } from "$lib/application";
import type { Program } from "$lib/domain";
import { TURTLOGO_V2, wallSide } from "$lib/domain";

// 動かない的（移動課題の到達目標）。
const DUMMY: Program = [];

// 4x4 の盤面を九十九折りにする辺壁。各行境界を1列だけ開けて一本道にする。
// 行0→1 は x=3 のみ開通、行1→2 は x=0 のみ、行2→3 は x=3 のみ。
const MAZE_WALLS = [
  wallSide({ x: 0, y: 0 }, "down"),
  wallSide({ x: 1, y: 0 }, "down"),
  wallSide({ x: 2, y: 0 }, "down"),
  wallSide({ x: 1, y: 1 }, "down"),
  wallSide({ x: 2, y: 1 }, "down"),
  wallSide({ x: 3, y: 1 }, "down"),
  wallSide({ x: 0, y: 2 }, "down"),
  wallSide({ x: 1, y: 2 }, "down"),
  wallSide({ x: 2, y: 2 }, "down"),
];

/** 九十九折りの一本道。壁をよけて奥の的へたどり着く移動課題。 */
export const WINDING_PATH_STAGE: Stage = {
  id: "winding-path",
  label: "曲がりくねった小道",
  goal: "壁をよけて迷路を進み、いちばん奥の的を倒そう",
  enemy: DUMMY,
  enemyLabel: "的",
  enemyBaseImage: TURTLOGO_V2,
  memoryTotal: 24, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: { width: 4, height: 4, walls: MAZE_WALLS },
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", pos: { x: 0, y: 0 }, dir: "right", hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 的なので動かず攻撃もしない。HP=1＝一撃で撃破＝到達＝クリア。
      { id: "enemy", pos: { x: 3, y: 3 }, dir: "left", hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
