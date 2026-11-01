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
    // ビルド済みイメージ（編集を凍結したスナップショット・不変）。試運転／デプロイの対象。
    // 未ビルドは null。生の編集とは別物で、ビルドして初めて確定する（bindable）。
    builtImage: Program | null;
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
    builtImage = $bindable(null),
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

  // ビルド状態：未ビルド（null）か、ビルド後に編集が乖離したか（要ビルド）。
  // 命令木は素直な JSON 構造なので文字列化比較で十分（YAGNI）。
  const notBuilt = $derived(builtImage === null);
  const dirty = $derived(builtImage !== null && JSON.stringify(program) !== JSON.stringify(builtImage));

  // 最終ビルド時刻。ビルドが「いつの断面か」を示し、ビルドの実在を体感させる（復元点の目印）。
  let builtAt = $state<number | null>(null);
  const builtAtLabel = $derived(
    builtAt === null ? null : new Date(builtAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
  );

  // ビルド＝現在の編集を凍結してイメージ化（試運転・デプロイの前提）。
  // $state.snapshot で生編集から切り離した不変スナップショットにする。
  function build() {
    builtImage = $state.snapshot(program) as Program;
    builtAt = Date.now();
  }

  // 最新ビルドに戻す＝編集中の変更を破棄してビルド断面へ復帰（ビルドを復元点として使う）。
  // Blockly が編集の SSoT なので load() で流し込み、program が順方向で戻る。
  function revertToBuilt() {
    if (builtImage === null) return;
    editor?.load(builtImage);
  }

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
      {@render tab("code", "mdi:code-braces", "エディタ編集")}
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

    <!-- ビルド操作：メイン領域の右上にオーバーラップ（全タブ共通）。
         枠は付けずボタンだけを重ね、左のタブ系ボタンと高さを揃える。
         各タブの中身はそのまま置く（ブロック編集で Blockly に重ねるのと同じ）。
         状態表示は3状態とも「アイコン＋時刻」で骨格を揃える（無=⚙--:--／新鮮=✓時刻／陳腐=↺時刻に戻す）。 -->
    <div class="absolute right-2 top-2 z-20 flex items-center gap-2">
      {#if notBuilt}
        <!-- 無：まだ焼けていない。時刻はプレースホルダ --:-- で骨格を揃える。 -->
        <span class="inline-flex items-center gap-1 text-xs text-warning-700">
          <Icon icon="mdi:progress-wrench" class="size-4" aria-label="未ビルド" />
          --:--
        </span>
      {:else if dirty}
        <!-- 陳腐：↺＋戻れる時刻＝最新ビルドに戻すボタン。出ている時点で要ビルドが伝わる。 -->
        <button
          class="inline-flex items-center gap-1 text-xs text-warning-700 hover:underline"
          onclick={revertToBuilt}
          title="最新ビルドに戻す"
        >
          <Icon icon="mdi:history" class="size-4" />
          {builtAtLabel} に戻す
        </button>
      {:else}
        <!-- 新鮮：ビルド済み・最新。ビルド時刻を静的に示す。 -->
        <span class="inline-flex items-center gap-1 text-xs text-success-700">
          <Icon icon="mdi:check-circle" class="size-4" aria-label="ビルド済み" />
          {builtAtLabel}
        </span>
      {/if}
      <button class="action-btn-strong" onclick={build}>
        <Icon icon="mdi:wrench" class="size-4" /> ビルド
      </button>
    </div>

    {#if mainView === "code"}
      <!-- エディタ編集面（フル領域）：ブロックから生成したコードを表示（読み取り専用）。
           ブロック⇄実コードの対応を見せる B面の芽。テキスト編集の配線は未対応（プレースホルダ）。 -->
      <div
        class="absolute inset-0 flex flex-col gap-2 overflow-hidden rounded border border-surface-300 {panelClass} p-3"
      >
        <!-- bodyClass の mt でコード枠だけ下げ、ブロック編集のキャンバス高さに合わせる（Ally 見出しは上のまま）。
             ブロック編集はパレット行の分だけキャンバスが下がるので、ここの mt を増減して揃える。 -->
        <ProgramViewer
          title="Ally"
          titleIcon={automatonIcon("ally")}
          {program}
          activeId={undefined}
          fill
          bodyClass="mt-3"
        />
      </div>
    {/if}

    {#if mainView === "registry"}
      <!-- レジストリ管理面（フル領域）。今は お手本からの pull だけ動く。
           ビルド＆push・版（v1→v2）・deploy・削除は裏側未実装（何もしないプレースホルダ）。 -->
      <div
        class="absolute inset-0 flex flex-col gap-3 overflow-auto rounded border border-surface-300 {panelClass} p-3"
      >
        <!-- ヘッダーは左寄せ：右上はビルドオーバーレイの定位置なので空ける。 -->
        <div class="flex shrink-0 items-center gap-3">
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
