<script lang="ts">
  // ステージ選択の「中身」。モーダル（今）と進行ページ（将来）で共通利用する。
  // chrome（モーダル枠／ページ枠）は持たず、一覧表示と選択だけに責務を絞る＝器を差し替えられる。
  import Icon from "@iconify/svelte";
  import { stageList } from "$lib/presentation/composition";

  interface StageSelectListProps {
    // 選択後に host（モーダル／ページ）が反応するためのフック（モーダルを閉じる・遷移する等）。
    onSelect?: (id: string) => void;
    // 現在選択中のステージ id（チェック表示用）。文脈が無ければ未指定＝無強調。
    selectedId?: string;
  }

  let { onSelect, selectedId }: StageSelectListProps = $props();

  function select(id: string) {
    onSelect?.(id);
  }
</script>

<!-- カード一覧。将来の進行ページでも同じ器で並べられるよう、切替行ではなくカードで持つ。
     TODO: アンロック状態・Tier/Chapter の階層表示は進行ルート導入時に足す。 -->
<ul class="grid grid-cols-1 gap-2 sm:grid-cols-2">
  {#each stageList as s (s.id)}
    <li>
      <button
        class="flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors {selectedId === s.id
          ? 'border-gray-800 bg-gray-50'
          : 'border-gray-300 hover:bg-gray-100'}"
        onclick={() => select(s.id)}
      >
        <div class="flex items-center gap-2">
          {#if selectedId === s.id}
            <Icon icon="mdi:check-circle" class="size-4 text-gray-800" />
          {:else}
            <Icon icon="mdi:circle-outline" class="size-4 text-gray-400" />
          {/if}
          <span class="font-bold">{s.label}</span>
          <span class="ml-auto shrink-0 text-xs opacity-50">{s.initial.grid.width}×{s.initial.grid.height}</span>
        </div>
        <p class="text-sm opacity-70">{s.goal}</p>
      </button>
    </li>
  {/each}
</ul>
