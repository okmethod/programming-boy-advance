<script lang="ts">
  // ステージ選択モーダル＝単純な切替用の器。中身は StageSelectList を共通利用する。
  // 将来の進行ページは同じ StageSelectList を別の器（ルート）に載せ替えるだけで済む。
  import Icon from "@iconify/svelte";
  import { fade } from "svelte/transition";
  import StageSelectList from "./StageSelectList.svelte";

  interface StageSelectModalProps {
    open: boolean;
    onClose: () => void;
  }

  let { open, onClose }: StageSelectModalProps = $props();
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center"
    transition:fade={{ duration: 150 }}
  >
    <button class="absolute inset-0 bg-black/40" aria-label="閉じる" onclick={onClose}></button>
    <div
      class="relative z-10 flex max-h-[80dvh] w-full max-w-lg flex-col gap-3 overflow-hidden rounded-xl bg-white p-4 shadow-xl"
    >
      <div class="flex shrink-0 items-center justify-between">
        <h2 class="inline-flex items-center gap-1 text-base font-bold">
          <Icon icon="mdi:map-marker-path" class="size-5" /> ステージ進行
        </h2>
        <button class="rounded p-1 hover:bg-gray-100" aria-label="閉じる" onclick={onClose}>
          <Icon icon="mdi:close" class="size-5" />
        </button>
      </div>
      <!-- 選ぶと閉じる（単純切替）。中身は共通コンポーネント。 -->
      <div class="min-h-0 overflow-auto">
        <StageSelectList onSelect={onClose} />
      </div>
    </div>
  </div>
{/if}
