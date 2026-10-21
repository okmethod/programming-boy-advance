/**
 * ステージ定義（アプリ層）。
 *
 * ステージ＝1 回の対戦の「お膳立て」。
 * 初期盤面・敵プログラム・提示テキストを束ねる。
 * プレイヤーの ally プログラムは外部（ブロックUI 等）から供給され、ここには含めない。
 */

import type { BattleState, Program } from "$lib/domain";

export interface Stage {
  readonly id: string;
  readonly label: string;
  // 勝利条件・攻略方針の説明（A面の親しみやすいテキスト）。
  readonly goal: string;
  readonly enemy: Program;
  readonly enemyLabel: string;
  readonly initial: BattleState;
}

// まっすぐ突進し続けるだけの敵（攻撃しない）。
const CHARGER: Program = [{ kind: "repeat", count: 100, body: [{ kind: "call", cmd: "stepForward" }] }];

/** 縦スライス検証用の単一ステージ。F2a では 1 枚だけ用意する。 */
export const STAGE_01: Stage = {
  id: "stage-01",
  label: "ステージ1：突進する敵",
  goal: "まっすぐ突進してくる敵を、近づいたら攻撃して倒そう",
  enemy: CHARGER,
  enemyLabel: "突進",
  initial: {
    grid: { width: 7, height: 3, walls: [] },
    automatons: [
      // priority はプレイヤー（ally）を高くして先手固定。
      { id: "ally", pos: { x: 0, y: 1 }, dir: "right", hp: 3, priority: 1 },
      { id: "enemy", pos: { x: 6, y: 1 }, dir: "left", hp: 3, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
