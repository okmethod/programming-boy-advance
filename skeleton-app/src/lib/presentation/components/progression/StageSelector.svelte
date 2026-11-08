<script lang="ts">
  // ステージセレクタ＝トリガ釦＋モーダルを自己所有し、選択→遷移まで内側で完結する器。
  // 中身の一覧は StageSelectList を共通利用する（器と中身を分離）。
  // 現在ステージ id は URL（page.params.stage）が SSoT。強調の材料として直接購読する。
  import Icon from "@iconify/svelte";
  import { fade } from "svelte/transition";
  import { page } from "$app/state";
  import { navigateTo } from "$lib/presentation/utils/navigation";
  import StageSelectList from "./StageSelectList.svelte";

  // 開閉状態（このセレクタが所有）。トリガで開き、選択／閉じるで閉じる。
  let open = $state(false);

  // 現在選択中のステージ id（プレイ面から開いたとき強調するため）。URL が SSoT。
  const selectedId = $derived(page.params.stage);

  // 選択＝閉じてプレイ面（/battle-pod/[stage]）へ遷移する。ステージ id は URL が SSoT。
  function select(id: string) {
    open = false;
    navigateTo(`/battle-pod/${id}`);
  }
</script>

<!-- トリガ＝固定ラベル。現在ステージ名はヘッダー中央に出るため、ここは出さず「ステージ選択」に留める。 -->
<button class="action-btn" onclick={() => (open = true)}>
  <Icon icon="mdi:map-marker-path" class="size-4" /> ステージ選択
</button>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center"
    transition:fade={{ duration: 150 }}
  >
    <button class="absolute inset-0 bg-black/40" aria-label="閉じる" onclick={() => (open = false)}></button>
    <div
      class="relative z-10 flex max-h-[80dvh] w-full max-w-lg flex-col gap-3 overflow-hidden rounded-xl bg-white p-4 shadow-xl"
    >
      <div class="flex shrink-0 items-center justify-between">
        <h2 class="inline-flex items-center gap-1 text-base font-bold">
          <Icon icon="mdi:map-marker-path" class="size-5" /> ステージ選択
        </h2>
        <button class="rounded p-1 hover:bg-gray-100" aria-label="閉じる" onclick={() => (open = false)}>
          <Icon icon="mdi:close" class="size-5" />
        </button>
      </div>
      <div class="min-h-0 overflow-auto">
        <StageSelectList onSelect={select} {selectedId} />
      </div>
    </div>
  </div>
{/if}
