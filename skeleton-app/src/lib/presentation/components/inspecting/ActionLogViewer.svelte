<script lang="ts">
  // 行動ログ（表示専用）：先頭〜現在フレームまでに指定オートマトンが起こした行動を
  // 1ターン1行の表（clock | command | code）で蓄積表示し、再生で末尾へ自動スクロールする。
  // ノード id の採番はドメイン（nodeIdMap）に委譲し、インタプリタ／ProgramViewer と必ず一致させる。
  import { tick } from "svelte";
  import Icon from "@iconify/svelte";
  import type { AutomatonId, BattleState, CommandName, Program } from "$lib/domain";
  import { nodeIdMap } from "$lib/domain";
  import { commandLabel } from "$lib/presentation/utils/labels";

  interface ActionLogViewerProps {
    // 省略時はヘッダー（見出し）を描画しない。観戦列はステータス側に名前を出すため不要。
    title?: string;
    titleIcon?: string;
    frames: readonly BattleState[];
    // 現在の再生位置（この位置までの行動を蓄積表示する）。
    frameIndex: number;
    program: Program;
    // ログ対象の陣営（active はこの id の実行ノードを引く）。
    id: AutomatonId;
    // true: 親の高さいっぱいに広げ内側でスクロール。既定は内容ぴったり。
    fill?: boolean;
    // true: 幅の狭い観戦列向け。clock を詰め、code 列を落として clock | command の2列にする。
    compact?: boolean;
  }

  let {
    title,
    titleIcon,
    frames,
    frameIndex,
    program,
    id,
    fill = false,
    compact = false,
  }: ActionLogViewerProps = $props();

  // ノード id → コマンド名の索引（配列）。active は常に call ノードを指す（インタプリタは call でのみ yield）。
  // Map はコンポーネント内で禁止（svelte/prefer-svelte-reactivity）のため、id を添字にした配列で持つ。
  const cmdByNode = $derived.by(() => {
    const arr: (CommandName | undefined)[] = [];
    for (const [stmt, nid] of nodeIdMap(program)) {
      if (stmt.kind === "call") arr[nid] = stmt.cmd;
    }
    return arr;
  });

  // 蓄積ログ：先頭〜現在フレームまで、1ターン1行。プログラム終了後（active なし）のフレームは記録しない。
  const log = $derived.by(() => {
    const lines: { clock: number; label: string; code: string }[] = [];
    const end = Math.min(frameIndex, frames.length - 1);
    for (let i = 1; i <= end; i++) {
      const frame = frames[i];
      const nid = frame.active?.[id];
      const cmd = nid !== undefined ? cmdByNode[nid] : undefined;
      // 擬似コードは flattenProgram と同じ `cmd()` 形式（B面＝実コードの対応を見せる）。
      if (cmd) lines.push({ clock: frame.clock, label: commandLabel(cmd), code: `${cmd}()` });
    }
    return lines;
  });

  let logEl = $state<HTMLElement>();

  // 行が増えたら（＝再生でフレームが進んだら）末尾へ追従する。DOM 反映後に動かすため tick を待つ。
  $effect(() => {
    void log.length;
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
      {#if log.length === 0}
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
            {#each log as line, i (i)}
              <tr class="border-t border-gray-800">
                <td class="{compact ? 'px-2' : 'px-3'} py-1 tabular-nums text-gray-400">{line.clock}</td>
                <td class="px-3 py-1">{line.label}</td>
                {#if !compact}<td class="px-3 py-1 font-mono text-green-300">{line.code}</td>{/if}
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>
</div>
