<script lang="ts">
  // 構築ボトムドロワー＝作業台。構築エリア（左・大）＋参照レール（右・初期盤面/敵コード or 試運転）。
  // 全幅を取れる下から出す形で Blockly に広さを与える。
  // 常時マウントして translate で開閉し、開閉でワークスペース（組みかけのブロック）が消えないようにする。
  // 開閉状態（open）はトリガーを持つ親（プレイ画面）が所有し、閉じ要求は onClose で返す。
  import Icon from "@iconify/svelte";
  import type {
    AutomatonImage,
    BaseImage,
    BattleFacade,
    BattleState,
    FlatLine,
    NodeId,
    Program,
  } from "#lib/application";
  import BuildingArea from "./BuildingArea.svelte";
  import BattlePodViewer from "#lib/presentation/components/spectating/BattlePodViewer.svelte";
  import SandboxRail from "#lib/presentation/components/spectating/SandboxRail.svelte";
  import SegmentedTabs from "#lib/presentation/components/shared/SegmentedTabs.svelte";
  import ProgramViewer from "#lib/presentation/components/inspecting/ProgramViewer.svelte";
  import { automatonIcon } from "#lib/presentation/utils/labels";
  import { fade } from "svelte/transition";

  interface ProgrammingDrawerProps {
    // 開閉状態＝トリガーを持つ親の所有。背景タップ・閉じるボタンは onClose で親へ返す。
    open: boolean;
    onClose: () => void;
    // ステージ由来の構築制約（BuildingArea へ素通し）。
    memoryTotal: number;
    memoryGrain: number;
    allowedImages?: readonly BaseImage[];
    // 参照レールの初期配置盤面＝ステージ定義の初期状態（実行結果ではなくデプロイ前から見られる）。
    stageInitial: BattleState;
    // 参照レールの敵プログラム表示（フラット行）。
    enemyLines: FlatLine[];
    // 試運転ソース＝ビルド済みイメージの program（未ビルドは null＝試運転不可）。
    sandboxImage: Program | null;
    facade: BattleFacade;
    // デプロイ押下＝ビルド済みイメージを対戦へ。再生リセットを伴うので親（プレイ画面）が処理する。
    onDeploy: (image: AutomatonImage, name: string, allyHp: number) => void;
  }

  let {
    open,
    onClose,
    memoryTotal,
    memoryGrain,
    allowedImages,
    stageInitial,
    enemyLines,
    sandboxImage,
    facade,
    onDeploy,
  }: ProgrammingDrawerProps = $props();

  // 構築ドロワー右レールの切替：参照（ステージの初期配置＋敵の手の内）⇄ 試運転（相手なし／stub の固定盤サンドボックス）。
  // 試運転は SandboxRail に切り出し済み（レジストリ管理ページと共有）。参照はステージ固有なので inline に残す。
  type RailView = "reference" | "sandbox";
  let railView = $state<RailView>("reference");
  const railTabs = [
    { value: "reference", icon: "mdi:map-marker-outline", label: "ステージ情報" },
    { value: "sandbox", icon: "mdi:flask-outline", label: "試運転" },
  ];

  // 試運転の再生状態・実行中ノードを右レール（SandboxRail）から受け、左の構築エリア（BuildingArea）の編集面へ渡す。
  // 兄弟パネル間の受け渡しは共通の親（このドロワー）で解決する。
  let sandboxPlaying = $state(false);
  let sandboxActiveId = $state<NodeId | undefined>(undefined);
</script>

{#if open}
  <button
    class="fixed inset-0 z-40 bg-black/40"
    aria-label="構築を閉じる"
    onclick={onClose}
    transition:fade={{ duration: 200 }}
  ></button>
{/if}
<aside
  class="fixed inset-x-0 bottom-0 z-50 flex h-[92dvh] flex-col overflow-hidden rounded-t-xl bg-surface-50 p-4 shadow-xl transition-transform duration-300 {open
    ? 'translate-y-0'
    : 'translate-y-full'}"
>
  <!-- 2カラム：左＝構築エリア／右＝参照レール（固定幅）。両列のヘッダー高を揃える。 -->
  <div class="flex min-h-0 flex-1 gap-4">
    <!-- 構築エリア：タブ（ブロック編集/エディタ編集/レジストリ）＋CPゲージ＋Blockly 等を内包。
         ドロワーは transform で開くため active にドロワー開閉を渡して開いた後に resize させる。 -->
    <BuildingArea
      {memoryTotal}
      {memoryGrain}
      {allowedImages}
      active={open}
      showDeploy
      {onDeploy}
      panelClass="bg-white"
      {sandboxPlaying}
      {sandboxActiveId}
    />

    <!-- 参照レール列：ヘッダー（参照⇄試運転タブ＋閉じる）＋本体（参照は inline／試運転は SandboxRail）。 -->
    <div class="flex min-h-0 w-[26rem] shrink-0 flex-col gap-3">
      <!-- ヘッダー行：高さは構築エリアのヘッダーと揃える。 -->
      <div class="flex h-9 shrink-0 items-center justify-between gap-3">
        <SegmentedTabs value={railView} items={railTabs} onChange={(v) => (railView = v as RailView)} />
        <button class="action-btn" onclick={onClose}>
          閉じる <Icon icon="mdi:close" class="size-4" />
        </button>
      </div>

      <!-- 本体：参照（ステージの初期配置＋敵の手の内）／試運転（SandboxRail）を同じ枠線で囲う。 -->
      <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-auto rounded border border-surface-300 bg-white p-3">
        {#if railView === "reference"}
          <!-- ヘッダー（左寄せ）：サンドボックスの見出し行と高さ・位置を揃え、下の盤面を一致させる。 -->
          <div class="flex h-7 shrink-0 items-center gap-1 text-xs font-bold opacity-70">
            <Icon icon="mdi:view-grid-outline" class="size-4" /> 初期配置
          </div>
          <!-- 盤面：試運転と同じ size="sm" なので位置も構造的に一致する。デプロイ前でも見られるよう
               実行結果ではなくステージ定義の初期状態（stageInitial）を直接描く。 -->
          <BattlePodViewer state={stageInitial} size="sm" />

          <ProgramViewer
            title="敵プログラム"
            titleIcon={automatonIcon("enemy")}
            lines={enemyLines}
            activeId={undefined}
            fill
          />
        {:else}
          <SandboxRail
            image={sandboxImage}
            {facade}
            bind:playing={sandboxPlaying}
            onActiveChange={(id) => (sandboxActiveId = id)}
          />
        {/if}
      </div>
    </div>
  </div>
</aside>
