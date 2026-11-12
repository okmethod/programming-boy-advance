<script lang="ts">
  // ステージセレクタ＝トリガ釦＋モーダルを自己所有し、選択→遷移まで内側で完結する器。
  // 中身の一覧は StageSelectList を共通利用する（器と中身を分離）。
  // 現在ステージ id は URL（page.params.stage）が SSoT。強調の材料として直接購読する。
  import Icon from "@iconify/svelte";
  import { page } from "$app/state";
  import { navigateTo } from "$lib/presentation/utils/navigation";
  import ModalShell from "$lib/presentation/components/shared/ModalShell.svelte";
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

<ModalShell {open} onClose={() => (open = false)} panelClass="max-w-lg">
  {#snippet title()}
    <Icon icon="mdi:map-marker-path" class="size-5" /> ステージ選択
  {/snippet}
  <div class="min-h-0 overflow-auto">
    <!-- モーダルは狭いクイック切替＝compact（単列・説明文なし・番号なし）で現在地強調だけ担う。 -->
    <StageSelectList onSelect={select} {selectedId} compact />
  </div>
</ModalShell>
