<script lang="ts">
  // 行動ログ（表示専用）：指定オートマトンが起こした行動を1行ずつ蓄積し、再生に合わせて末尾へ自動スクロールする。
  // フレーム列 × program からの畳み込みは app 層（buildActionLog）が担うので、ここは行（View Model）を受け取る dumb view。
  import { tick } from "svelte";
  import type { ActionLogRow } from "#lib/application";
  import { commandLabel } from "#lib/presentation/utils/labels";
  import DarkViewerPanel from "./DarkViewerPanel.svelte";

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

  let scrollEl = $state<HTMLElement>();

  // 行が増えたら（＝再生でフレームが進んだら）末尾へ追従する。DOM 反映後に動かすため tick を待つ。
  $effect(() => {
    void rows.length;
    if (!scrollEl) return;
    tick().then(() => {
      if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
    });
  });
</script>

<DarkViewerPanel
  {title}
  {titleIcon}
  {fill}
  bind:scrollEl
  scrollClass="text-xs text-gray-200"
  empty={rows.length === 0}
  emptyIcon="mdi:console-line"
  emptyLabel="ログがありません"
>
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
</DarkViewerPanel>
