<script lang="ts">
  // 観戦ビューの陣営カラム（Ally/Enemy 共通）。ステータス計器／ビュー切替タブ／本体を1枚の黒パネルに積む。
  // Ally=デプロイ済みの実体（未デプロイは inactive＋空プログラム）、Enemy=ステージ固定。
  // 本体は「正体（イメージ）→ プログラム → ログ」をカラム内で切り替える（切替状態は各列が独立に持つ）。
  import type { AutomatonId, BattleState, FlatLine, NodeId, ActionLogRow, BaseImage } from "#lib/application";
  import AutomatonStatusViewer from "./AutomatonStatusViewer.svelte";
  import SegmentedTabs from "#lib/presentation/components/shared/SegmentedTabs.svelte";
  import ProgramViewer from "#lib/presentation/components/inspecting/ProgramViewer.svelte";
  import ActionLogViewer from "#lib/presentation/components/inspecting/ActionLogViewer.svelte";
  import ImageViewer from "#lib/presentation/components/inspecting/ImageViewer.svelte";

  interface SpectatorColumnProps {
    // ステータス計器（HP セグメント＋BP 波形）の入力。
    frames: readonly BattleState[];
    frameIndex: number;
    id: AutomatonId;
    maxHp: number;
    bpMax: number;
    // 未起動（未デプロイ）＝まだ出撃していない。HP0 を撃破ではなく休眠として描く。
    inactive?: boolean;
    // プログラム（擬似コード）ビュー。activeId＝現在クロックで実行中の命令ノード。
    lines: FlatLine[];
    activeId?: NodeId;
    // ログ（行動履歴）ビュー。
    log: ActionLogRow[];
    // イメージ（正体＝ハッシュ-名前-時刻）ビュー。Ally は timeLabel/drift を持ち、Enemy は持たない。
    hash: string | null;
    name: string;
    baseImage?: BaseImage | null;
    timeLabel?: string | null;
    drift?: boolean;
    emptyLabel?: string;
  }

  let {
    frames,
    frameIndex,
    id,
    maxHp,
    bpMax,
    inactive = false,
    lines,
    activeId,
    log,
    hash,
    name,
    baseImage = null,
    timeLabel = null,
    drift = false,
    emptyLabel = "未デプロイ",
  }: SpectatorColumnProps = $props();

  // 本体の表示切替：プログラム（擬似コード）／ログ（行動履歴）／イメージ（正体）。列ごとに独立して持つ。
  type ColumnView = "program" | "log" | "image";
  let view = $state<ColumnView>("program");
  // 列ごとのビュー切替タブ（イメージ＝正体 → プログラム → ログ）。パネルの見出しに置く。
  const columnTabs = [
    { value: "image", icon: "mdi:cube-outline", label: "イメージ" },
    { value: "program", icon: "mdi:code-braces", label: "プログラム" },
    { value: "log", icon: "mdi:table", label: "ログ" },
  ];
</script>

<!-- 陣営カラム：ステータス／ビュー切替タブ／本体を1枚の黒パネルに統合する。 -->
<div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-900 text-gray-200">
  <AutomatonStatusViewer {frames} {frameIndex} {id} {maxHp} {bpMax} {inactive} />
  <!-- ビュー切替タブ（ダーク）＝パネル内の区切り兼見出し。イメージ/プログラム/ログ。 -->
  <div class="flex shrink-0 justify-center border-t border-gray-800 p-2">
    <SegmentedTabs value={view} items={columnTabs} onChange={(v) => (view = v as ColumnView)} dense dark />
  </div>
  <!-- ビュー本体（パネル下段・フル高。各ビューワーの黒地が親パネルと一体に見える）。 -->
  <div class="flex min-h-0 flex-1 flex-col p-3 pt-0">
    {#if view === "program"}
      <ProgramViewer {lines} {activeId} fill showFollow />
    {:else if view === "log"}
      <ActionLogViewer {log} {frameIndex} fill compact />
    {:else}
      <!-- イメージ＝正体。Ally は未デプロイ時に空表示＋ドリフトで「要再デプロイ」、Enemy はステージ固定。 -->
      <ImageViewer {hash} {name} {baseImage} {timeLabel} {drift} {emptyLabel} fill />
    {/if}
  </div>
</div>
