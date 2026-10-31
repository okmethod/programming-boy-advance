<script lang="ts">
  // 試運転レール＝作業台の右側（試運転のみ）。相手なし／stub の固定盤で ally を単体実行し、
  // 「観る→直す→また観る」を本番対戦と切り離して回す。arena のレールとレジストリ管理ページで共有する。
  import Icon from "@iconify/svelte";
  import type { BattleFacade, SandboxTarget } from "$lib/application";
  import type { Program } from "$lib/domain";
  import BattlePodViewer from "./BattlePodViewer.svelte";
  import PlaybackController from "./PlaybackController.svelte";
  import ActionLogViewer from "$lib/presentation/components/inspecting/ActionLogViewer.svelte";

  interface SandboxRailProps {
    // 試運転対象のプログラム。
    program: Program;
    // ゲームロジックの単一窓口（runSandbox を呼ぶ）。
    facade: BattleFacade;
  }

  let { program, facade }: SandboxRailProps = $props();

  // 試運転の的：none=何もいない（移動・制御フローの確認）／stub=攻撃できる的（enemyAhead を
  // 発火させ攻撃反応まで確認）。棚＝ビルド済みイメージだけを共有する方針なので共有ストアに載せない。
  let sandboxTarget = $state<SandboxTarget>("stub");
  let frameIndex = $state(0);
  let playing = $state(false);

  const run = $derived(facade.runSandbox(program, sandboxTarget));
  const frames = $derived(run.frames);
  const current = $derived(frames[Math.min(frameIndex, frames.length - 1)]);
  const lastIndex = $derived(frames.length - 1);

  // プログラム／的が変わったら先頭に戻す（直前の試運転を持ち越さない）。
  $effect(() => {
    void program;
    void sandboxTarget;
    frameIndex = 0;
    playing = false;
  });
</script>

<!-- ヘッダー（固定高 h-7）：左に「サンドボックス」見出し、右に stub の有無スイッチ。 -->
<div class="flex h-7 shrink-0 items-center justify-between gap-1">
  <span class="flex items-center gap-1 text-xs font-bold opacity-70">
    <Icon icon="mdi:flask-outline" class="size-4" /> サンドボックス
  </span>
  <!-- stub（攻撃できる的）の有無を切り替えるシンプルなスイッチ。ラベルは stub のみ（OFF＝的なし）。 -->
  <button
    type="button"
    role="switch"
    aria-checked={sandboxTarget === "stub"}
    aria-label="stub（的）の有無"
    class="inline-flex items-center gap-1.5 text-xs"
    onclick={() => (sandboxTarget = sandboxTarget === "stub" ? "none" : "stub")}
  >
    <span class={sandboxTarget === "stub" ? "font-bold text-blue-700" : "text-gray-400"}>stub</span>
    <span
      class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors {sandboxTarget === 'stub'
        ? 'bg-blue-600'
        : 'bg-gray-300'}"
    >
      <span
        class="inline-block size-4 rounded-full bg-white shadow transition-transform {sandboxTarget === 'stub'
          ? 'translate-x-[18px]'
          : 'translate-x-0.5'}"
      ></span>
    </span>
  </button>
</div>

<!-- 盤面：再生は下、残りはログで埋める。 -->
<div class="flex shrink-0 justify-center">
  <BattlePodViewer state={current} size="sm" stubEnemy={sandboxTarget === "stub"} />
</div>
<PlaybackController bind:frameIndex bind:playing {lastIndex} clock={current.clock} />

<!-- ログ：先頭〜現在フレームまでの ally の行動を蓄積表示（残り領域を埋める）。再生で末尾へ自動スクロール。 -->
<ActionLogViewer title="logs" titleIcon="mdi:console-line" {frames} {frameIndex} {program} id="ally" fill />
