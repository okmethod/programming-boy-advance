/**
 * 試運転（サンドボックス）のお膳立て。
 *
 * ステージ（本番対戦）とは別物：相手なし・固定盤・勝敗なしで、ally のプログラムを単体で動かす。
 * B面＝ローカル実行×テストダブル（stub）。「書く → ローカルで試す → 本番」の "試す" を担う。
 */

import type { Automaton, BattleState } from "$lib/domain";

/**
 * 試運転で ally の前に置く的。
 * - none: 何もいない（移動・向き・制御フローの確認）
 * - stub: 攻撃できる的（stub＝テストダブル。enemyAhead が true になり攻撃反応まで確認）
 */
export type SandboxTarget = "none" | "stub";

// 固定盤（ステージに依存しない中立の作業台）。本番盤とは独立に小さく固定する。
const SANDBOX_GRID = { width: 7, height: 3, walls: [] } as const;

/** 試運転の初期盤面を組む。stub は反撃しない的（enemy スロットを空プログラムで稼働させる）。 */
export function sandboxInitial(target: SandboxTarget): BattleState {
  // 左右対称に配置：ally は左から2番目(x=1)、カカシは右から2番目(x=5)。幅7の中央(x=3)を挟んで向かい合う。
  const ally: Automaton = {
    id: "ally",
    pos: { x: 1, y: 1 },
    dir: "right",
    hp: 3,
    bp: 0,
    freezeRemaining: 0,
    priority: 1,
  };
  // stub は観察用に HP を厚めに持たせ、数発では倒れず挙動を見られるようにする。
  const stub: Automaton = {
    id: "enemy",
    pos: { x: 5, y: 1 },
    dir: "left",
    hp: 5,
    bp: 0,
    freezeRemaining: 0,
    priority: 0,
  };
  return {
    grid: SANDBOX_GRID,
    automatons: target === "stub" ? [ally, stub] : [ally],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  };
}

// 試運転の最大クロック（本番の 1000 より短く）。倒れた stub を殴り続けても暴走しないよう上限を抑える。
export const SANDBOX_MAX_CLOCKS = 300;
