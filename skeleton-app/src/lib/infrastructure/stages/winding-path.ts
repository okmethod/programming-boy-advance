/**
 * 曲がりくねった小道のステージ定義（インフラ層・TS 定数版）。
 *
 * 辺壁（セル間の壁）で作ったサーペンタイン（九十九折り）の一本道を導入する。
 * 各行は 1 箇所でしか隣の行へ繋がらないため、迷路を順にたどる移動課題になる。
 * 敵は brittleAttack（暴発のみ）を無心に振り続ける脆弱型で、プレイヤーが正面に立つと自壊する
 * ＝攻撃を持たないカメ v1 でも「位置取り」だけで勝てる Chap1 の勝ち筋（[[chap1-design]]）。
 */

import type { Stage } from "$lib/application";
import type { Program } from "$lib/domain";
import { BRITTLE_SENTRY, wallSide } from "$lib/domain";

// 脆弱型の敵＝正面に相手が来た時だけ発動する brittleAttack を無心に振り続ける。空振りは無害。
// プレイヤーが正面に立った瞬間に自壊する（→ engine の brittleAttack＝暴発のみ）。
const BRITTLE: Program = [
  { kind: "while", cond: { kind: "literal", value: true }, body: [{ kind: "call", cmd: "brittleAttack" }] },
];

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

/** 九十九折りの一本道。壁をよけて奥の敵の正面まで進むと、敵が自壊してクリア。 */
export const WINDING_PATH_STAGE: Stage = {
  id: "winding-path",
  label: "曲がりくねった小道",
  goal: "壁をよけて迷路を進み、いちばん奥の敵の正面に立とう（敵は正面に立たれると自壊する）",
  enemy: BRITTLE,
  enemyLabel: "こわれ番人",
  enemyBaseImage: BRITTLE_SENTRY,
  memoryTotal: 24, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: { width: 4, height: 4, walls: MAZE_WALLS },
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", pos: { x: 0, y: 0 }, dir: "right", hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 上（y 減）を向く＝正面セルは (3,2)。プレイヤーがそこへ到達した瞬間、brittleAttack が暴発して自壊する。
      // HP は暴発で 0 になるので初期値は 1（生存していればよい）。
      { id: "enemy", pos: { x: 3, y: 3 }, dir: "up", hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
