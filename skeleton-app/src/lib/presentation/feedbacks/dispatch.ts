/**
 * dispatch - 演出フィードバックの中核。アクションを登録済みの全媒体へ配る（媒体の中身は知らない）。
 *
 * 発火点（call site）は emitFeedback(action) を呼ぶだけで媒体に依存しない。
 * 媒体（音・トースト・…）は registerMedium で自分を足す＝媒体追加で call site を触らない。
 */

import type { GameAction } from "./actions";

/** 1 つの媒体。アクションを受け、自分が担当する分だけ演出する（担当外は何もしない）。 */
export type FeedbackMedium = (action: GameAction) => void;

const media: FeedbackMedium[] = [];

/** 媒体を登録する（モジュール読込時に各媒体が自分を足す）。 */
export function registerMedium(medium: FeedbackMedium): void {
  media.push(medium);
}

/** アクションの確定を全媒体へ通知する。 */
export function emitFeedback(action: GameAction): void {
  for (const medium of media) medium(action);
}
