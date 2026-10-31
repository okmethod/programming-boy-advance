<script lang="ts">
  // 命令木（Program）を擬似コードで表示し、現在クロックで実行中の行を
  // IDE のデバッガ風（行番号ガター＋矢印マーカー＋行ハイライト）に示す（表示専用）。
  // 平坦化とノード id の採番はドメイン（flattenProgram）に委譲し、インタプリタの採番と必ず一致させる。
  import { tick } from "svelte";
  import Icon from "@iconify/svelte";
  import type { NodeId, Program } from "$lib/domain";
  import { flattenProgram } from "$lib/domain";

  interface ProgramViewerProps {
    // 省略時はヘッダー（見出し）を描画しない。観戦列はステータス側に名前を出すため不要。
    title?: string;
    // 見出し左に添える mdi アイコン名（陣営識別用）。title とセットで使う。
    titleIcon?: string;
    program: Program;
    // 現在クロックで実行中の命令ノード id（無ければハイライトなし）。
    activeId?: NodeId;
    // true: 親の高さいっぱいに広げ、長ければ内側でスクロール（エディタ面用）。既定は内容ぴったり。
    fill?: boolean;
    // 実行行への自動スクロール（追従）トグルを出すか。観戦の自/敵ビューだけで使う。
    showFollow?: boolean;
  }

  let { title, titleIcon, program, activeId, fill = false, showFollow = false }: ProgramViewerProps = $props();

  const lines = $derived(flattenProgram(program));

  // 追従（自動スクロール）の ON/OFF。手で遡って読みたい時にユーザーが切れるようにする。
  let autoFollow = $state(true);
  let scrollEl = $state<HTMLElement>();

  // activeId が変わるたび、追従 ON なら現在行をスクロール範囲内に収める。
  // 高速再生でも追いつくよう behavior は即時（smooth にしない）。DOM 反映後に動かすため tick を待つ。
  $effect(() => {
    const id = activeId;
    if (!showFollow || !autoFollow || id == null || !scrollEl) return;
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
  <!-- スクロール領域を relative で包み、追従トグルを内側・右上に absolute 固定（スクロールで流れない）。 -->
  <div class="relative {fill ? 'min-h-0 flex-1' : ''}">
    {#if showFollow}
      <!-- 追従トグル：ON で実行行を自動追尾、OFF で手スクロール固定。アイコンのみ（状態は色＋照準の入/切で示す）。 -->
      <button
        class="absolute right-1.5 top-1.5 z-10 inline-flex items-center justify-center rounded border p-1 {autoFollow
          ? 'border-amber-400 bg-amber-400 text-gray-900'
          : 'border-gray-600 bg-gray-900/70 text-gray-300 hover:bg-gray-800'}"
        aria-pressed={autoFollow}
        aria-label={autoFollow ? "実行行の追従：オン" : "実行行の追従：オフ"}
        title={autoFollow ? "実行行を自動で追いかける（オン）" : "実行行の追従はオフ"}
        onclick={() => (autoFollow = !autoFollow)}
        ><Icon icon={autoFollow ? "mdi:crosshairs-gps" : "mdi:crosshairs"} class="size-4" /></button
      >
    {/if}
    <div
      bind:this={scrollEl}
      class="overflow-auto rounded bg-gray-900 py-1 font-mono text-xs leading-relaxed text-green-300 {fill
        ? 'h-full'
        : 'min-h-24'}"
    >
      {#if lines.length === 0}
        <div class="px-2 opacity-60">(なし)</div>
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
