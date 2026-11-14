/**
 * 演出フィードバックの公開 API。
 *
 * 発火点は emitFeedback(action) を呼ぶだけ。
 * 媒体（音・将来のトースト/アニメ）はこのバレルの読込時に副作用で登録される
 * （media/* を import するだけで call site は媒体を知らない）。
 */

// 媒体の登録（副作用 import）。媒体を増やすときはここに 1 行足す。
import "./media/sound";

export { emitFeedback } from "./dispatch";
export type { GameAction } from "./actions";
