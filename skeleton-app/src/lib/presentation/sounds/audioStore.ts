/**
 * audioStore - Web Audio API のライフサイクル管理ストア。
 *
 * ブラウザは「ユーザー操作なしに AudioContext を起動できない」制約を持つため、
 * 音声 ON/OFF の状態と AudioContext の遅延初期化をここに集約する。
 * soundEffects.ts はこのストア経由で AudioContext を取得する。
 */

import { readonly, writable, get } from "svelte/store";

// 初回 ON（ユーザー操作）まで AudioContext を生成しないため、既定は false。
const audioOnStore = writable<boolean>(false);

/** 音声 ON/OFF 状態（UI 購読用）。 */
export const audioOn = readonly(audioOnStore);

/** 音声 ON/OFF を切り替える。初回 ON 時にユーザー操作イベント内で AudioContext を初期化する。 */
export function setAudioOn(on: boolean): void {
  audioOnStore.set(on);
  if (on && !audioContext) {
    initializeAudioContext();
  }
}

// AudioContext はユーザー操作イベント内でのみ生成できる（ブラウザ制約）。遅延初期化に閉じる。
// 呼び出しは常にクライアントのクリック経路だが、念のため window 不在（SSR）では生成しない。
let audioContext: AudioContext | null = null;
function initializeAudioContext(): void {
  if (typeof window === "undefined") return;
  audioContext = new window.AudioContext();
}

/** AudioContext を返す。音声オフまたは未初期化なら null（再生側は null で無音にする）。 */
export function audioContextProvider(): AudioContext | null {
  if (!audioContext || !get(audioOnStore)) {
    return null;
  }
  return audioContext;
}
