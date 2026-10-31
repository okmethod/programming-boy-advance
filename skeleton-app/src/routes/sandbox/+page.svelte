<script lang="ts">
  // サンドボックスページ：ステージを選ばず「組む→試運転」だけを回す独立画面。
  // プレイ面のような対戦（勝敗）・deploy は無く、構築エリア（左）と試運転レール（右）だけを置く。
  // レジストリ（お手本/手持ちイメージの管理）は構築エリア内のタブ＝このページの一部。
  // 構築エリア・試運転レールはプレイ面の構築ドロワーと同じコンポーネントを共有する。
  import { battleFacade } from "$lib/presentation/composition";
  import type { Program } from "$lib/domain";
  import { ALLY_PRESETS, DEFAULT_AUTOMATON_CAPACITY } from "$lib/presentation/constants/allyPresets";
  import BuildingArea from "$lib/presentation/components/building/BuildingArea.svelte";
  import SandboxRail from "$lib/presentation/components/spectating/SandboxRail.svelte";

  // 編集中の Program。SSoT は BuildingArea 内部の Blockly で、ここへ断面が流れてくる。
  let program = $state<Program>([]);
</script>

<!-- 一画面（iPad 横向き前提・スクロール無し）：ヘッダーの残り高を埋め、はみ出しは内側で吸収。 -->
<div class="mx-auto flex h-full max-w-7xl flex-col gap-3 overflow-hidden p-3">
  <!-- 2カラム：左＝構築エリア（flex-1）／右＝試運転レール（固定幅）。プレイ面ドロワーの骨格を踏襲。 -->
  <div class="flex min-h-0 flex-1 gap-4">
    <BuildingArea bind:program cpLimit={DEFAULT_AUTOMATON_CAPACITY} presets={ALLY_PRESETS} active />

    <!-- 試運転レール：プレイ面のレールと同じ枠線で囲い、SandboxRail を落とし込む。 -->
    <div class="flex min-h-0 w-[26rem] shrink-0 flex-col">
      <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-auto rounded border border-surface-300 bg-surface-50 p-3">
        <SandboxRail {program} facade={battleFacade} />
      </div>
    </div>
  </div>
</div>
