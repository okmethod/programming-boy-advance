<script lang="ts">
  // ステージ選択ページ（簡易版）。モーダルと同じ中身 StageSelectList を、器だけページに載せ替える。
  // 選ぶと観戦（プレイ面）へ遷移する。将来はここにアンロック状態・Tier/Chapter 階層を育てる。
  import Icon from "@iconify/svelte";
  import { navigateTo } from "$lib/presentation/utils/navigation";
  import StageSelectList from "$lib/presentation/components/progression/StageSelectList.svelte";
</script>

<div class="mx-auto flex h-full max-w-3xl flex-col gap-4 p-4">
  <h1 class="inline-flex items-center gap-2 text-xl font-bold">
    <Icon icon="mdi:map-marker-path" class="size-6" /> ステージ進行
  </h1>
  <p class="text-sm opacity-70">挑むステージを選ぼう。選ぶと観戦画面へ進む。</p>
  <!-- 選択するとプレイ面へ。選択状態は stageSelection ストアに入るので遷移先がそのまま使う。 -->
  <StageSelectList onSelect={() => navigateTo("/battle-pod")} />
</div>
