<script lang="ts">
  // 試運転レール＝作業台の右側（試運転のみ）。相手なし／stub の固定盤で ally を単体実行し、
  // 「観る→直す→また観る」を本番対戦と切り離して回す。プレイ面のレールとレジストリ管理ページで共有する。
  import Icon from "@iconify/svelte";
  import { buildActionLog, type BattleFacade, type SandboxTarget, type Program, type NodeId } from "$lib/application";
  import BattlePodViewer from "./BattlePodViewer.svelte";
  import PlaybackController from "./PlaybackController.svelte";
  import ActionLogViewer from "$lib/presentation/components/inspecting/ActionLogViewer.svelte";

  interface SandboxRailProps {
    // 試運転対象のビルド済みイメージ（未ビルドは null）。生の編集ではなくビルド断面を食う。
    image: Program | null;
    // ゲームロジックの単一窓口（runSandbox を呼ぶ）。
    facade: BattleFacade;
    // 再生中か（上へ報告）。再生は PlaybackController が両方向で持つため bindable。親はこれを観て編集面の観戦切替に使う。
    playing?: boolean;
    // 現在フレームで ally が実行中の命令ノード id を親へ報告する（子→親の一方向なのでコールバック）。
    onActiveChange?: (id: NodeId | undefined) => void;
  }

  let { image, facade, playing = $bindable(false), onActiveChange }: SandboxRailProps = $props();

  // 試運転の的：none=何もいない（移動・制御フローの確認）／stub=攻撃できる的（enemyAhead を
  // 発火させ攻撃反応まで確認）。棚＝ビルド済みイメージだけを共有する方針なので共有ストアに載せない。
  let sandboxTarget = $state<SandboxTarget>("stub");
  let frameIndex = $state(0);

  // 未ビルド（image=null）のときは実行しない。ビルドして初めて試運転できる。
  const run = $derived(image ? facade.runSandbox(image, sandboxTarget) : null);
  const frames = $derived(run?.frames ?? []);
  const current = $derived(frames.length > 0 ? frames[Math.min(frameIndex, frames.length - 1)] : null);
  const lastIndex = $derived(Math.max(0, frames.length - 1));

  // 現在フレームの ally 実行中ノードを親へ報告する（編集面ハイライトの素通し口）。
  $effect(() => {
    onActiveChange?.(current?.active?.ally);
  });

  // イメージ／的が変わったら先頭に戻す（直前の試運転を持ち越さない）。
  $effect(() => {
    void image;
    void sandboxTarget;
    frameIndex = 0;
    playing = false;
  });
</script>

<!-- ヘッダー：左に「サンドボックス」見出し、右にサンドバッグの有無スイッチ。 -->
<div class="flex h-7 shrink-0 items-center justify-between gap-1">
  <span class="flex items-center gap-1 text-xs font-bold opacity-70">
    <Icon icon="mdi:flask-outline" class="size-4" /> サンドボックス
  </span>
  <!-- サンドバッグ（攻撃できる的）の有無を切り替えるスイッチ。ビルド前は試運転自体が出ないので隠す。 -->
  {#if image}
    <button
      type="button"
      role="switch"
      aria-checked={sandboxTarget === "stub"}
      aria-label="サンドバッグ（的）の有無"
      class="inline-flex items-center gap-1.5 text-xs"
      onclick={() => (sandboxTarget = sandboxTarget === "stub" ? "none" : "stub")}
    >
      <span class={sandboxTarget === "stub" ? "font-bold text-secondary-700" : "text-surface-400"}>サンドバッグ</span>
      <span
        class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors {sandboxTarget ===
        'stub'
          ? 'bg-secondary-600'
          : 'bg-surface-300'}"
      >
        <span
          class="inline-block size-4 rounded-full bg-surface-50 shadow transition-transform {sandboxTarget === 'stub'
            ? 'translate-x-[18px]'
            : 'translate-x-0.5'}"
        ></span>
      </span>
    </button>
  {/if}
</div>

{#if image && current}
  <!-- 盤面：再生は下、残りはログで埋める。 -->
  <div class="flex shrink-0 justify-center">
    <BattlePodViewer state={current} size="sm" stubEnemy={sandboxTarget === "stub"} />
  </div>
  <PlaybackController bind:frameIndex bind:playing {lastIndex} clock={current.clock} />

  <!-- ログ：先頭〜現在フレームまでの ally の行動を蓄積表示（残り領域を埋める）。再生で末尾へ自動スクロール。 -->
  <ActionLogViewer
    title="ログ"
    titleIcon="mdi:console-line"
    log={buildActionLog(frames, image, "ally")}
    {frameIndex}
    fill
  />
{:else}
  <!-- 未ビルド：生の編集は食わない方針なので、ビルドを促して試運転は出さない。 -->
  <div class="flex flex-1 flex-col items-center justify-center gap-2 text-center text-surface-500">
    <Icon icon="mdi:cog-outline" class="size-8 opacity-60" />
    <p class="text-sm">ビルドすると試運転できます</p>
  </div>
{/if}
