<script lang="ts">
  // 擬似コード行（FlatLine[]）を表示し、実行中の行を IDE のデバッガ風にハイライトする（表示専用）。
  // 平坦化とノード id 採番はドメイン（flatLines）の責務なので、呼び出し元が投影した View Model を受け取る
  // ＝この部品は Program を知らない dumb view（採番はインタプリタ／flatLines と必ず一致する）。
  import { tick } from "svelte";
  import Icon from "@iconify/svelte";
  import type { NodeId, FlatLine } from "$lib/domain";

  interface ProgramViewerProps {
    // 省略時はヘッダー（見出し）を描画しない。観戦列はステータス側に名前を出すため不要。
    title?: string;
    // 見出し左に添える mdi アイコン名（陣営識別用）。title とセットで使う。
    titleIcon?: string;
    // 表示する擬似コード行（呼び出し元が flatLines で投影した View Model）。
    lines: FlatLine[];
    // 現在クロックで実行中の命令ノード id（無ければハイライトなし）。
    activeId?: NodeId;
    // true: 親の高さいっぱいに広げ、長ければ内側でスクロール（エディタ面用）。既定は内容ぴったり。
    fill?: boolean;
    // 実行行への自動スクロール（追従）を有効にするか。観戦の自/敵ビューだけで使う（常時 ON）。
    showFollow?: boolean;
    // コード枠（本体）に足すクラス。上に別オーバーレイが重なる場所で枠だけ下げる高さ調整に使う。
    bodyClass?: string;
  }

  let {
    title,
    titleIcon,
    lines,
    activeId,
    fill = false,
    showFollow = false,
    bodyClass = "",
  }: ProgramViewerProps = $props();

  let scrollEl = $state<HTMLElement>();

  // activeId が変わるたび、現在行をスクロール範囲内に収める（追従は常時 ON）。
  // 高速再生でも追いつくよう behavior は即時（smooth にしない）。DOM 反映後に動かすため tick を待つ。
  $effect(() => {
    const id = activeId;
    if (!showFollow || id == null || !scrollEl) return;
    tick().then(() => {
      const el = scrollEl?.querySelector<HTMLElement>("[data-active]");
      el?.scrollIntoView({ block: "nearest" });
    });
  });
</script>

<div class={fill ? "flex min-h-0 flex-1 flex-col" : ""}>
  {#if title}
    <h2 class="mb-1 inline-flex items-center gap-1 text-sm font-bold">
      {#if titleIcon}<Icon icon={titleIcon} class="size-4" />{/if}
      {title}
    </h2>
  {/if}
  <div class="relative {fill ? 'min-h-0 flex-1' : ''} {bodyClass}">
    <div
      bind:this={scrollEl}
      class="overflow-auto rounded bg-gray-900 py-1 font-mono text-xs leading-relaxed text-green-300 {fill
        ? 'h-full'
        : 'min-h-24'}"
    >
      {#if lines.length === 0}
        <!-- 空表示：ログビューと見た目を揃える（中央寄せ・淡色・アイコン付き）。 -->
        <div
          class="flex h-full min-h-24 flex-col items-center justify-center gap-1.5 p-4 text-center font-pixel text-gray-500"
        >
          <Icon icon="mdi:code-braces" class="size-6 opacity-40" />
          <span>プログラムがありません</span>
        </div>
      {:else}
        {#each lines as line, i (i)}
          {@const active = line.id !== null && line.id === activeId}
          <!-- デバッガの現在行：左ボーダー＋淡い黄ハイライト、ガターに ▶。data-active は追従スクロールの目印。 -->
          <div
            data-active={active ? "" : undefined}
            class="flex items-start {active ? 'border-yellow-400 bg-yellow-400/20' : 'border-transparent'} border-l-2"
          >
            <span class="w-4 shrink-0 select-none text-center text-yellow-400">{active ? "▶" : ""}</span>
            <span class="w-7 shrink-0 select-none pr-2 text-right text-gray-500">{i + 1}</span>
            <span class="whitespace-pre pr-2 {active ? 'text-yellow-100' : ''}"
              >{"  ".repeat(line.indent)}{line.text}</span
            >
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>
