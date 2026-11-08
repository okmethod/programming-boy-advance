<script lang="ts">
  // 観戦ビューワーの共通器＝暗地（gray-900）のスクロール枠。プログラム／ログ／イメージの各ビューで体裁を揃える。
  // fill ラッパ・任意のタイトル見出し・空表示（中央寄せアイコン＋文言）までを持ち、中身（非空時の行）は children で受ける。
  // 追従スクロールする消費側（実行行へ／末尾へ）は bind:scrollEl で内側スクロール要素の DOM 参照を受け取る。
  import type { Snippet } from "svelte";
  import Icon from "@iconify/svelte";

  interface DarkViewerPanelProps {
    // 省略時はヘッダー（見出し）を描画しない。観戦列はステータス側に名前を出すため不要。
    title?: string;
    // 見出し左に添える mdi アイコン名。title とセットで使う。
    titleIcon?: string;
    // true: 親の高さいっぱいに広げ、長ければ内側でスクロール。既定は内容ぴったり。
    fill?: boolean;
    // スクロール枠を囲む relative ラッパに足すクラス（枠だけ下げる高さ調整など）。
    bodyClass?: string;
    // 暗色スクロール枠に足す配色・余白・フォント（ビューごとに異なる中身の体裁）。
    scrollClass?: string;
    // true で中身を空表示（アイコン＋文言）に差し替える。空判定は消費側が持つ。
    empty?: boolean;
    emptyIcon?: string;
    emptyLabel?: string;
    // 内側スクロール要素の DOM 参照（追従スクロールする消費側が bind で受け取る）。
    scrollEl?: HTMLElement;
    // 非空時の中身（行の描画）。
    children: Snippet;
  }

  let {
    title,
    titleIcon,
    fill = false,
    bodyClass = "",
    scrollClass = "",
    empty = false,
    emptyIcon = "mdi:information-outline",
    emptyLabel = "",
    scrollEl = $bindable(),
    children,
  }: DarkViewerPanelProps = $props();
</script>

<div class={fill ? "flex min-h-0 flex-1 flex-col" : ""}>
  {#if title}
    <h2 class="mb-1 inline-flex items-center gap-1 text-sm font-bold">
      {#if titleIcon}<Icon icon={titleIcon} class="size-4" />{/if}
      {title}
    </h2>
  {/if}
  <div class="relative {fill ? 'min-h-0 flex-1' : ''} {bodyClass}">
    <div bind:this={scrollEl} class="overflow-auto rounded bg-gray-900 {scrollClass} {fill ? 'h-full' : 'min-h-24'}">
      {#if empty}
        <!-- 空表示：3ビューで見た目を揃える（中央寄せ・淡色・アイコン付き）。 -->
        <div
          class="flex h-full min-h-24 flex-col items-center justify-center gap-1.5 p-4 text-center font-pixel text-gray-500"
        >
          <Icon icon={emptyIcon} class="size-6 opacity-40" />
          <span>{emptyLabel}</span>
        </div>
      {:else}
        {@render children()}
      {/if}
    </div>
  </div>
</div>
