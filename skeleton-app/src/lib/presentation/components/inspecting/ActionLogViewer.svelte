<script lang="ts">
  // 行動ログ（表示専用）：指定オートマトンが起こした行動を1行ずつ蓄積し、再生に合わせて末尾へ自動スクロールする。
  // フレーム列 × program からの畳み込みは app 層（buildActionLog）が担うので、ここは行（View Model）を受け取る dumb view。
  import { tick } from "svelte";
  import Icon from "@iconify/svelte";
  import type { ActionLogRow } from "$lib/application";
  import { commandLabel } from "$lib/presentation/utils/labels";

  interface ActionLogViewerProps {
    // 省略時はヘッダー（見出し）を描画しない。観戦列はステータス側に名前を出すため不要。
    title?: string;
    titleIcon?: string;
    // 行動ログ（全長）＝呼び出し元が buildActionLog で畳んだ View Model。
    log: ActionLogRow[];
    // 現在の再生位置（この位置までに実行された行を表示する）。
    frameIndex: number;
    // true: 親の高さいっぱいに広げ内側でスクロール。既定は内容ぴったり。
    fill?: boolean;
    // true: 幅の狭い観戦列向け。clock を詰め、code 列を落として clock | command の2列にする。
    compact?: boolean;
  }

  let { title, titleIcon, log, frameIndex, fill = false, compact = false }: ActionLogViewerProps = $props();

  // 再生位置までの prefix を表示する（frame <= frameIndex）。ラベル・擬似コードへの整形はここで。
  // 擬似コードは flatLines と同じ `cmd()` 形式（B面＝実コードの対応を見せる）。
  const rows = $derived(
    log
      .filter((row) => row.frame <= frameIndex)
      .map((row) => ({ clock: row.clock, label: commandLabel(row.cmd), code: `${row.cmd}()` })),
  );

  let logEl = $state<HTMLElement>();

  // 行が増えたら（＝再生でフレームが進んだら）末尾へ追従する。DOM 反映後に動かすため tick を待つ。
  $effect(() => {
    void rows.length;
    if (!logEl) return;
    tick().then(() => {
      if (logEl) logEl.scrollTop = logEl.scrollHeight;
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
  <div class={fill ? "min-h-0 flex-1" : ""}>
    <div
      bind:this={logEl}
      class="overflow-auto rounded bg-gray-900 text-xs text-gray-200 {fill ? 'h-full' : 'min-h-24'}"
    >
      {#if rows.length === 0}
        <!-- 空表示：プログラムビューと見た目を揃える（中央寄せ・淡色・アイコン付き）。 -->
        <div
          class="flex h-full min-h-24 flex-col items-center justify-center gap-1.5 p-4 text-center font-pixel text-gray-500"
        >
          <Icon icon="mdi:console-line" class="size-6 opacity-40" />
          <span>ログがありません</span>
        </div>
      {:else}
        <table class="w-full border-collapse text-left">
          <thead class="sticky top-0 bg-gray-900 text-gray-500">
            <tr>
              <th class="{compact ? 'w-8 px-2' : 'px-3'} py-1 font-normal">clock</th>
              <th class="px-3 py-1 font-normal">command</th>
              {#if !compact}<th class="px-3 py-1 font-normal">code</th>{/if}
            </tr>
          </thead>
          <tbody>
            {#each rows as row, i (i)}
              <tr class="border-t border-gray-800">
                <td class="{compact ? 'px-2' : 'px-3'} py-1 tabular-nums text-gray-400">{row.clock}</td>
                <td class="px-3 py-1">{row.label}</td>
                {#if !compact}<td class="px-3 py-1 font-mono text-green-300">{row.code}</td>{/if}
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>
</div>
