<script lang="ts">
  import "../app.css";
  import type { Snippet } from "svelte";
  import { page } from "$app/state";
  import Icon from "@iconify/svelte";
  import { navigateTo } from "#lib/presentation/utils/navigation";
  import { pageTitle } from "#lib/presentation/utils/routes";
  import { audioOn, setAudioOn, playSE } from "#lib/presentation/sounds";
  import StageSelector from "#lib/presentation/components/progression/StageSelector.svelte";
  import ToastLayer from "#lib/presentation/components/shared/ToastLayer.svelte";

  let { children }: { children: Snippet } = $props();

  // ヘッダー中央に出す現在ページ名。ルート id（base path 非依存）から引く。
  const currentPageTitle = $derived(pageTitle(page.route.id));

  // 音声トグル。ON にした瞬間だけ合図音を鳴らす（このクリックで AudioContext が起動するので同じ gesture 内で鳴らせる）。
  function toggleAudio() {
    const next = !$audioOn;
    setAudioOn(next);
    if (next) playSE.audioOn();
  }
</script>

<svelte:head>
  <title>PGM Boy Advance</title>
</svelte:head>

<ToastLayer />

<div class="h-dvh flex flex-col">
  <!-- Skeleton v5 で AppBar は Svelte コンポーネントではなくなったため、素の要素で代替する。
       左＝ブランド表示（クリックでホームへ）、右＝セクション間ナビ。アクション（組む）は画面側に置く。 -->
  <header class="shrink-0 border-b border-surface-400">
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
        <!-- 効果音 ON/OFF（アプリ全体設定）。AudioContext はユーザー操作内でのみ起動できるため、このクリックで初期化する。 -->
        <button
          class="action-btn"
          onclick={toggleAudio}
          aria-label={$audioOn ? "効果音をオフにする" : "効果音をオンにする"}
        >
          <Icon icon={$audioOn ? "mdi:volume-high" : "mdi:volume-off"} class="size-4" />音声
        </button>
        <!-- ステージセレクタ（トリガ＋モーダルを自己所有）。選んだステージは URL（/battle-pod/[stage]）が SSoT。 -->
        <StageSelector />
        <button class="action-btn">
          <Icon icon="mdi:book-open-variant" class="size-4" /> B面解説
        </button>
        <!-- レジストリ管理はグローバルナビに置かない。pull（お手本/手持ちイメージ読み込み）は
             構築の流れの中で起きるため、組むドロワー側に居場所を持つ。 -->
      </nav>
    </div>
  </header>

  <!-- 残り高を埋めるコンテンツ領域。プレイ面は h-full で一画面に収め、books 等は内側でスクロール。 -->
  <main class="w-full min-h-0 flex-1 overflow-y-auto scrollbar-gutter-stable">
    {@render children()}
  </main>
</div>
