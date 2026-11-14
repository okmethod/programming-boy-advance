/**
 * bubble - 吹き出しの媒体。アクションを短い通知文へ写像し、押した要素の近傍に数秒だけ出す。
 *
 * 音と対称の薄い自己完結モジュール（registerMedium で自分を足すだけ）。
 * 近傍配置は @floating-ui/dom に委ね（画面端での反転・寄せを任せる）、表示/消滅は自前で持つ。
 * 位置は発火の瞬間にアンカーの矩形を同期スナップショットして確定する
 * （操作した瞬間のライブ位置を捉えつつ、直後にモーダルが閉じてボタンが消えても位置がぶれない）。
 * アンカーの無いアクションは画面右上へフォールバックし、メッセージを持たないアクションは何もしない
 * どのアクションに吹き出しを出すかはこの map が正。
 */

import { computePosition, flip, shift, offset } from "@floating-ui/dom";
import type { GameAction } from "../actions";
import { registerMedium } from "../dispatch";

// アクション → 吹き出し文。ここに載せたアクションだけ吹き出しを出す（短い英語過去形で操作の結果だけを示す）。
const MESSAGES: Partial<Record<GameAction, string>> = {
  build: "Built !",
  deploy: "Deployed !",
  push: "Pushed !",
  pull: "Pulled !",
  rename: "Renamed !",
  delete: "Deleted !",
  baseImage: "Switched !",
  allocate: "Allocated !",
  revert: "Reverted !",
  run: "Started !",
};

const VISIBLE_MS = 1400; // 表示を保つ時間（この後フェードアウトして除去）。
const FADE_MS = 200; // フェードイン／アウトの所要時間（除去の待ちにも使う）。

// 自己完結の吹き出し要素を1つ組み立てる（Tailwind の動的生成は走査外になるため、クラスは文字列リテラルで与える）。
function createBubble(message: string): HTMLElement {
  const el = document.createElement("div");
  el.textContent = message;
  el.className =
    "pointer-events-none fixed top-0 left-0 z-50 rounded-md px-2 py-0.5 text-xs font-bold " +
    "preset-filled-error-500 shadow-md opacity-0 transition-opacity duration-200";
  return el;
}

// スナップショットした矩形の近傍へ置く。矩形が無ければ画面右上の固定位置へフォールバックする。
async function place(el: HTMLElement, rect: DOMRect | undefined): Promise<void> {
  if (!rect) {
    el.style.transform = "translate(calc(100vw - 100% - 1rem), 1rem)";
    return;
  }
  // floating-ui の仮想要素＝確定済みの矩形を基準にする（元のボタンが消えても参照しない）。
  // strategy:"fixed"＝要素が position:fixed なので座標系をビューポート基準に合わせる。
  const { x, y } = await computePosition({ getBoundingClientRect: () => rect }, el, {
    strategy: "fixed",
    placement: "top",
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  });
  el.style.transform = `translate(${x}px, ${y}px)`;
}

async function showBubble(message: string, rect: DOMRect | undefined): Promise<void> {
  const el = createBubble(message);
  document.body.appendChild(el);
  await place(el, rect);

  // 次フレームで不透明へ＝初期 opacity-0 からの transition を発火させる。
  requestAnimationFrame(() => el.classList.remove("opacity-0"));

  window.setTimeout(() => {
    el.classList.add("opacity-0");
    window.setTimeout(() => el.remove(), FADE_MS);
  }, VISIBLE_MS);
}

registerMedium((action, context) => {
  const message = MESSAGES[action];
  if (!message) return;
  // 発火の瞬間に矩形を確定する（直後にモーダルが閉じてボタンが消えても位置がぶれない）。
  const rect = context.anchor?.getBoundingClientRect();
  void showBubble(message, rect);
});
