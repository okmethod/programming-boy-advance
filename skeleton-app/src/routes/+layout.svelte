<script lang="ts">
  import "../app.css";
  import type { Snippet } from "svelte";
  import { page } from "$app/state";
  import { Portal, Toast } from "@skeletonlabs/skeleton-svelte";
  import Icon from "@iconify/svelte";
  import { toaster } from "$lib/presentation/utils/toaster";
  import { navigateTo } from "$lib/presentation/utils/navigation";
  import { pageTitle } from "$lib/presentation/constants/routes";
  import StageSelectModal from "$lib/presentation/components/progression/StageSelectModal.svelte";

  let { children }: { children: Snippet } = $props();

  // ヘッダー中央に出す現在ページ名。ルート id（base path 非依存）から引く。
  const currentPageTitle = $derived(pageTitle(page.route.id));

  // ステージ進行＝ステージ選択モーダル。単純切替は器としてモーダルを使う（将来はページへ昇格）。
  // 現在ステージ名は画面中央上部に出るため、ここは固定ラベルにとどめる。
  let stageSelectOpen = $state(false);
</script>

<svelte:head>
  <title>PGM Boy Advance</title>
</svelte:head>

<Portal>
  <Toast.Group {toaster} class="fixed top-4 right-4 z-50 flex flex-col gap-2">
    {#snippet children(toast)}
      <Toast {toast} class="card w-64 rounded-lg p-4 shadow-lg md:w-96">
        <div class="flex w-full items-center gap-2">
          <Toast.Title class="flex-1">{toast.title}</Toast.Title>
          <Toast.CloseTrigger class="btn-icon btn-icon-sm preset-tonal ml-auto shrink-0">
            <Icon icon="mdi:close" class="size-4" />
          </Toast.CloseTrigger>
        </div>
      </Toast>
    {/snippet}
  </Toast.Group>
</Portal>

<div class="h-screen flex flex-col">
  <!-- Skeleton v5 で AppBar は Svelte コンポーネントではなくなったため、素の要素で代替する。
       左＝ブランド表示（クリックでホームへ）、右＝セクション間ナビ。アクション（組む）は画面側に置く。 -->
  <header class="shrink-0 border-b border-gray-400">
    <div class="relative flex items-center gap-2 p-1 md:p-2">
      <button class="text-sm font-bold hover:opacity-70 md:text-lg" onclick={() => navigateTo("/")}>
        PGM Boy Advance
      </button>

      <!-- 現在ページ名：ヘッダー幅の中央に絶対配置（左ブランド・右ナビの幅に依らず中央に揃える）。
           クリックを吸わないよう pointer-events-none。ホーム等（空文字）では出さない。 -->
      {#if currentPageTitle}
        <span class="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-bold md:text-lg">
          {currentPageTitle}
        </span>
      {/if}

      <nav class="ml-auto flex items-center gap-1 text-sm">
        <!-- ステージ進行＝ステージ選択モーダルを開く。選択状態は stageSelection ストアでプレイ面と共有する。 -->
        <button
          class="inline-flex items-center gap-1 rounded border border-gray-300 bg-gray-100 px-2 py-1 hover:bg-gray-200"
          onclick={() => (stageSelectOpen = true)}
        >
          <Icon icon="mdi:map-marker-path" class="size-4" /> ステージ選択
        </button>
        <button
          class="inline-flex items-center gap-1 rounded border border-gray-300 bg-gray-100 px-2 py-1 hover:bg-gray-200"
        >
          <Icon icon="mdi:book-open-variant" class="size-4" /> B面解説
        </button>
        <!-- レジストリ管理はグローバルナビに置かない。pull（お手本/手持ちイメージ読み込み）は
             構築の流れの中で起きるため、組むドロワー側に居場所を持つ。 -->
      </nav>
    </div>
  </header>

  <!-- 残り高を埋めるコンテンツ領域。プレイ面は h-full で一画面に収め、books 等は内側でスクロール。 -->
  <main class="w-screen mx-auto min-h-0 flex-1 overflow-y-auto scrollbar-gutter-stable">
    {@render children()}
  </main>
</div>

<!-- ステージ選択モーダル（単純切替）。中身 StageSelectList は将来の進行ページと共通。 -->
<StageSelectModal open={stageSelectOpen} onClose={() => (stageSelectOpen = false)} />
