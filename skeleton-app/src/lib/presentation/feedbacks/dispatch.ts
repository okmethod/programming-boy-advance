/**
 * dispatch - 演出フィードバックの中核。アクションを登録済みの全媒体へ配る（媒体の中身は知らない）。
 *
 * 発火点（call site）は emitFeedback(action, context?) を呼ぶだけで媒体に依存しない。
 * 媒体（音・吹き出し・…）は registerMedium で自分を足す＝媒体追加で call site を触らない。
 */

import type { GameAction } from "./actions";

/**
 * 演出に添える文脈。位置を要する媒体（吹き出し等）が基準要素を受け取るための通路。
 * 位置を持たない媒体（音）は無視してよい＝文脈は常に任意。
 */
export interface FeedbackContext {
  // 吹き出しを近傍に出す基準要素（通常は押されたボタン）。無ければ媒体ごとの既定位置へ出す。
  readonly anchor?: HTMLElement;
}

/** 1 つの媒体。アクションと文脈を受け、自分が担当する分だけ演出する（担当外は何もしない）。 */
export type FeedbackMedium = (action: GameAction, context: FeedbackContext) => void;

const media: FeedbackMedium[] = [];

/** 媒体を登録する（モジュール読込時に各媒体が自分を足す）。 */
export function registerMedium(medium: FeedbackMedium): void {
  media.push(medium);
}

/** アクションの確定を全媒体へ通知する。context は位置を要する媒体にだけ届く任意の添え物。 */
export function emitFeedback(action: GameAction, context: FeedbackContext = {}): void {
  for (const medium of media) medium(action, context);
}
