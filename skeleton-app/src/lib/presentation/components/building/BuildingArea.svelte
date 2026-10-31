<script lang="ts">
  // 構築エリア＝作業台の左側。タブ（ブロック編集/エディタ編集/レジストリ）＋CPゲージ＋
  // Blockly（編集の SSoT・常時マウント）＋エディタ編集面＋レジストリ一覧を内包する。
  // プレイ面の構築ドロワーとレジストリ管理ページで共有し、ステージ依存の差分は props で吸収する。
  import { tick } from "svelte";
  import Icon from "@iconify/svelte";
  import { programCost, type Program } from "$lib/domain";
  import type { AllyPreset } from "$lib/presentation/constants/allyPresets";
  import { automatonIcon } from "$lib/presentation/utils/labels";
  import BlocklyEditor from "./BlocklyEditor.svelte";
  import CapacityGauge from "./CapacityGauge.svelte";
  import ProgramViewer from "$lib/presentation/components/inspecting/ProgramViewer.svelte";

  interface BuildingAreaProps {
    // 編集中の Program。SSoT は内部 Blockly で、ここから読み取り専用の断面が流れ出る（bindable）。
    program: Program;
    // CP（作成予算）の上限。プレイ面=stage.capacity／レジストリ管理=既定容量。
    cpLimit: number;
    // レジストリ一覧の元になるお手本プリセット。
    presets: Record<string, AllyPreset>;
    // 表示中か。transform で開くドロワーは ResizeObserver が発火しないため、
    // active かつブロック編集面のとき tick 後に Blockly を明示 resize する。
    active: boolean;
    // レジストリ一覧の deploy ボタンを出すか（プレイ面=true／レジストリ管理=false）。
    showDeploy?: boolean;
    // エディタ/レジストリ面パネルの背景クラス。このエリアを置く親の背景に合わせる。
    panelClass?: string;
  }

  let {
    program = $bindable(),
    cpLimit,
    presets,
    active,
    showDeploy = false,
    panelClass = "bg-surface-50", // 既定: 薄緑地
  }: BuildingAreaProps = $props();

  // メイン領域の表示切替。ブロック編集 / エディタ編集（生成コード表示）/ レジストリ。
  let mainView = $state<"edit" | "code" | "registry">("edit");

  // BlocklyEditor への参照。お手本 pull は program を直接書き換えず、この load() を通して
  // Blockly に流し込む（Blockly → Program の順方向で program が更新される）。
  let editor = $state<BlocklyEditor>();

  // CP（作成予算）の消費量。組んだブロック数から算出する（戦闘状態とは独立）。
  const cpUsed = $derived(programCost(program));

  // 表示開始／編集面復帰で Blockly の表示領域が変わる。transform で開くと ResizeObserver が
  // 発火しないため、DOM 反映（tick）後に明示 resize してスクロールバーを正す。
  $effect(() => {
    if (!active || mainView !== "edit") return;
    tick().then(() => editor?.resize());
  });
</script>

<!-- 構築エリア全体：ヘッダー（タブ＋ゲージ）＋メイン領域を縦に積む。 -->
<div class="flex min-h-0 flex-1 flex-col gap-3">
  <!-- ヘッダー行（固定高 h-9＝右レールのヘッダーと高さを揃える）。 -->
  <div class="flex h-9 shrink-0 items-center gap-4">
    <div class="flex items-center gap-1">
      {#snippet tab(value: "edit" | "code" | "registry", icon: string, label: string)}
        <button class={mainView === value ? "action-btn-strong" : "action-btn"} onclick={() => (mainView = value)}>
          <Icon {icon} class="size-4" />
          {label}
        </button>
      {/snippet}
      {@render tab("edit", "mdi:puzzle-outline", "ブロック編集")}
      {@render tab("code", "mdi:keyboard-outline", "エディタ編集")}
      {@render tab("registry", "mdi:package-variant", "レジストリ")}
    </div>
    <CapacityGauge used={cpUsed} limit={cpLimit} />
  </div>

  <!-- メイン領域：Blockly は常時マウント＆サイズ確定のまま裏に残し（切替で組みかけが消えない）、
       エディタ編集・レジストリ面は上に重ねてフル領域で出す。 -->
  <div class="relative min-h-0 flex-1">
    <!-- 編集面：ブロック編集以外では invisible で隠す＝ツールボックスが前面に透けるのを防ぐ。
         visibility:hidden なのでサイズは保持され、切替で再描画が壊れない（unmount しない）。 -->
    <div class="h-full {mainView !== 'edit' ? 'invisible' : ''}">
      <BlocklyEditor bind:this={editor} onProgramChange={(p) => (program = p)} />
    </div>

    {#if mainView === "code"}
      <!-- エディタ編集面（フル領域）：ブロックから生成したコードを表示（読み取り専用）。
           ブロック⇄実コードの対応を見せる B面の芽。テキスト編集の配線は未対応（プレースホルダ）。 -->
      <div
        class="absolute inset-0 flex flex-col gap-2 overflow-hidden rounded border border-surface-300 {panelClass} p-3"
      >
        <ProgramViewer title="Ally" titleIcon={automatonIcon("ally")} {program} activeId={undefined} fill />
      </div>
    {/if}

    {#if mainView === "registry"}
      <!-- レジストリ管理面（フル領域）。今は お手本からの pull だけ動く。
           ビルド＆push・版（v1→v2）・deploy・削除は裏側未実装（何もしないプレースホルダ）。 -->
      <div
        class="absolute inset-0 flex flex-col gap-3 overflow-auto rounded border border-surface-300 {panelClass} p-3"
      >
        <div class="flex shrink-0 items-center justify-between">
          <h3 class="inline-flex items-center gap-1 text-sm font-bold">
            <Icon icon="mdi:package-variant" class="size-4" /> オートマトンイメージ
          </h3>
          <button class="action-btn">
            <Icon icon="mdi:tray-arrow-up" class="size-4" /> ビルドして保存
          </button>
        </div>

        <!-- 一覧（各行＝オートマトンイメージ）。将来は自ビルド版（name:v1→v2）もここに並ぶ。 -->
        <ul class="flex flex-col gap-2">
          {#each Object.entries(presets) as [key, p] (key)}
            <li class="flex items-center justify-between gap-3 rounded border border-surface-200 px-3 py-2">
              <div class="min-w-0">
                <span class="text-sm">お手本：{p.label}</span>
                <span class="ml-2 text-xs opacity-50">v1</span>
              </div>
              <div class="flex shrink-0 gap-2">
                <!-- pull＝Blockly に展開して編集面へ戻る（唯一の実動作）。 -->
                <button
                  class="action-btn"
                  onclick={() => {
                    editor?.load(p.program);
                    mainView = "edit";
                  }}
                >
                  pull
                </button>
                <!-- deploy は裏側未実装のプレースホルダ。ステージ非依存のページでは出さない。 -->
                {#if showDeploy}
                  <button class="rounded border border-surface-300 px-3 py-1 text-sm text-surface-400">deploy</button>
                {/if}
                <!-- 削除も裏側未実装のプレースホルダ（何もしない）。 -->
                <button class="rounded border border-surface-300 px-2 py-1 text-sm text-surface-400" aria-label="削除">
                  <Icon icon="mdi:delete-outline" class="size-4" />
                </button>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>
