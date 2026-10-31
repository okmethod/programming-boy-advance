/**
 * ステージ取得の Port（アプリ層が依存する抽象）。
 *
 * ステージ定義の供給元（TS 定数・将来の JSON/DSL・API）をゲームロジックから隠す継ぎ目。
 * アプリ層はこの契約だけに依存し、具体実装（インフラ層の Adapter）は合成ルートで注入される。
 * 設計の最新断面は docs/design/architecture.md を正とする。
 */

import type { BattleState, Program } from "$lib/domain";

/**
 * ステージ＝1 回の対戦の「お膳立て」。
 * 初期盤面・敵プログラム・提示テキストを束ねる。
 * プレイヤーの ally プログラムは外部（ブロックUI 等）から供給され、ここには含めない。
 */
export interface Stage {
  readonly id: string;
  readonly label: string;
  // 勝利条件・攻略方針の説明（A面の親しみやすいテキスト）。
  readonly goal: string;
  readonly enemy: Program;
  readonly enemyLabel: string;
  readonly initial: BattleState;
  // CP（キャパシティ）上限＝このステージで組めるブロック数の予算。
  readonly capacity: number;
}

/** ステージ定義の取得口。供給元はインフラ層の Adapter が実装する。 */
export interface StageRepository {
  /** id でステージ定義を取得する。未知の id は例外。 */
  get(id: string): Stage;
  /** 選択 UI 用に全ステージ定義を一覧する（登録順）。 */
  list(): readonly Stage[];
}
