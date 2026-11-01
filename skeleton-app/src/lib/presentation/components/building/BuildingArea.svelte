<script lang="ts">
  // 構築エリア＝作業台の左側。
  // タブ（ブロック編集/エディタ編集/レジストリ）＋Blockly（編集の SSoT・常時マウント）＋エディタ編集面＋レジストリ一覧を内包する。
  // CP ゲージは編集時のプログラムに紐づくので枠内ヘッダー帯の中央あたりにオーバーレイする
  // （ブロック編集/エディタ編集で同位置・レジストリでは隠す）。
  // プレイ面の構築ドロワーとレジストリ管理ページで共有し、ステージ依存の差分は props で吸収する。
  import { tick } from "svelte";
  import Icon from "@iconify/svelte";
  import { programCost, type Program } from "$lib/domain";
  import { registry } from "$lib/presentation/stores/registryStore.svelte";
  import { automatonIcon } from "$lib/presentation/utils/labels";
  import BlocklyEditor from "./BlocklyEditor.svelte";
  import CapacityGauge from "./CapacityGauge.svelte";
  import SegmentedTabs from "$lib/presentation/components/shared/SegmentedTabs.svelte";
  import ProgramViewer from "$lib/presentation/components/inspecting/ProgramViewer.svelte";

  interface BuildingAreaProps {
    // 編集中の Program。SSoT は内部 Blockly で、ここから読み取り専用の断面が流れ出る（bindable）。
    program: Program;
    // ビルド済みイメージ（編集を凍結したスナップショット・不変）。試運転／デプロイの対象。
    // 未ビルドは null。生の編集とは別物で、ビルドして初めて確定する（bindable）。
    builtImage: Program | null;
    // CP（作成予算）の上限。プレイ面=stage.capacity／レジストリ管理=既定容量。
    cpLimit: number;
    // 表示中か。transform で開くドロワーは ResizeObserver が発火しないため、
    // active かつブロック編集面のとき tick 後に Blockly を明示 resize する。
    active: boolean;
    // デプロイ（編集文脈の前進）を出すか（プレイ面=true／サンドボックス=false）。
    showDeploy?: boolean;
    // デプロイ押下＝ビルド済みイメージを対戦に反映する。親（プレイ面）が対戦に流す。
    onDeploy?: (image: Program) => void;
    // エディタ/レジストリ面パネルの背景クラス。このエリアを置く親の背景に合わせる。
    panelClass?: string;
  }

  let {
    program = $bindable(),
    builtImage = $bindable(null),
    cpLimit,
    active,
    showDeploy = false,
    onDeploy,
    panelClass = "bg-surface-50", // 既定: 薄緑地
  }: BuildingAreaProps = $props();

  // メイン領域の表示切替。ブロック編集 / エディタ編集（生成コード表示）/ レジストリ。
  type MainView = "edit" | "code" | "registry";
  let mainView = $state<MainView>("edit");
  const mainTabs = [
    { value: "edit", icon: "mdi:puzzle-outline", label: "ブロック編集" },
    { value: "code", icon: "mdi:code-braces", label: "エディタ編集" },
    { value: "registry", icon: "mdi:package-variant", label: "レジストリ" },
  ];

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

  // ビルド済みイメージと同一内容の既存イメージ（あれば＝プッシュ不要）。未ビルドは対象外。
  const duplicate = $derived(builtImage !== null ? registry.duplicateOf(builtImage) : undefined);
  const alreadyPushed = $derived(duplicate !== undefined);

  // プッシュ＝ビルド済みイメージをレジストリに保存。生の編集ではなくビルド断面を積む。
  function pushImage() {
    if (builtImage === null) return;
    registry.push(builtImage);
  }

  // プル＝レジストリのイメージを Blockly に展開し編集面へ戻る（改良の起点）。
  function pullImage(program: Program) {
    editor?.load(program);
    mainView = "edit";
  }

  // リネーム（インライン編集）。編集中の行 id と入力値を持ち、Enter/blur で確定・Escape で取消。
  let renamingId = $state<string | null>(null);
  let renameValue = $state("");

  function startRename(id: string, label: string) {
    renamingId = id;
    renameValue = label;
  }
  function commitRename() {
    if (renamingId === null) return;
    const label = renameValue.trim();
    if (label.length > 0) registry.rename(renamingId, label);
    renamingId = null;
  }
  // インライン入力はマウント時にフォーカスしたい（bind:this は不安定なので use: で登録）。
  function autofocus(node: HTMLInputElement) {
    node.focus();
    node.select();
  }

  // プッシュ済みイメージの保存時刻ラベル（版メタデータ）。ビルド時刻と同じ HH:MM 表記。
  function pushedAtLabel(pushedAt: number): string {
    return new Date(pushedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
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
  <!-- ヘッダー行（固定高 h-9＝右レールのヘッダーと高さを揃える）。
       ビュー切替は副作用のないナビゲーションなので、命令ボタンと質を分けてセグメントタブで表す。 -->
  <div class="flex h-9 shrink-0 items-center">
    <SegmentedTabs value={mainView} items={mainTabs} onChange={(v) => (mainView = v as MainView)} />
  </div>

  <!-- メイン領域：Blockly は常時マウント＆サイズ確定のまま裏に残し（切替で組みかけが消えない）、
       エディタ編集・レジストリ面は上に重ねてフル領域で出す。 -->
  <div class="relative min-h-0 flex-1">
    <!-- 編集面：ブロック編集以外では invisible で隠す＝ツールボックスが前面に透けるのを防ぐ。
         visibility:hidden なのでサイズは保持され、切替で再描画が壊れない（unmount しない）。 -->
    <div class="h-full {mainView !== 'edit' ? 'invisible' : ''}">
      <BlocklyEditor bind:this={editor} onProgramChange={(p) => (program = p)} />
    </div>

    <!-- CP ゲージ＝編集中プログラムの作成予算。
         枠内ヘッダー帯（カテゴリ行の高さ）に合わせ、中央あたりにオーバーレイする。
         ブロック編集・エディタ編集で同じ位置に出し、レジストリでは隠す。
         エディタ編集面のコードは暗地（gray-900）なので、淡色チップに載せてどちらの面でも読めるようにする。 -->
    {#if mainView !== "registry"}
      <div
        class="absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded border border-surface-300 bg-surface-50/95 px-2 py-0.5 shadow-sm"
      >
        <CapacityGauge used={cpUsed} limit={cpLimit} />
      </div>
    {/if}

    <!-- ビルド操作：メイン領域の右上にオーバーラップ（全タブ共通）。
         枠は付けずボタンだけを重ね、左のタブ系ボタンと高さを揃える。
         状態表示は3状態とも「アイコン＋時刻」で骨格を揃える（無=⚙--:--／新鮮=✓時刻／陳腐=↺時刻に戻す）。
         アクションは「ビルド（全タブ共通アンカー）＋ 文脈の前進」。前進は編集=デプロイ／レジストリ=プッシュ。 -->
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
      {#if mainView === "registry"}
        <!-- レジストリ文脈の前進＝プッシュ（ビルド済みイメージを保管庫へ）。
             未ビルドは押せない。同一内容が登録済みなら重複を積まないよう無効化する。 -->
        <button
          class="action-btn disabled:opacity-40"
          onclick={pushImage}
          disabled={notBuilt || alreadyPushed}
          title={notBuilt
            ? "先にビルド"
            : alreadyPushed
              ? `「${duplicate?.label}」と重複`
              : "ビルド済みイメージをレジストリに保存"}
        >
          <Icon icon="mdi:tray-arrow-up" class="size-4" /> プッシュ
        </button>
      {:else if showDeploy}
        <!-- 編集文脈の前進＝デプロイ（ビルド済みイメージを対戦に反映）。未ビルドは押せない。 -->
        <button
          class="action-btn disabled:opacity-40"
          onclick={() => builtImage && onDeploy?.(builtImage)}
          disabled={notBuilt}
          title={notBuilt ? "先にビルド" : "ビルド済みイメージを対戦に反映"}
        >
          <Icon icon="mdi:rocket-launch-outline" class="size-4" /> デプロイ
        </button>
      {/if}
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
          title="プログラム"
          titleIcon={automatonIcon("ally")}
          {program}
          activeId={undefined}
          fill
          bodyClass="mt-3"
        />
      </div>
    {/if}

    {#if mainView === "registry"}
      <!-- レジストリ管理面（フル領域）。共有ストア（in-memory）の手持ちを並べ、push/pull/削除を実配線。
           deploy は Slice 3 まで未配線（プレースホルダ）。永続化・版管理は未着手（store 側に集約）。 -->
      <div
        class="absolute inset-0 flex flex-col gap-3 overflow-auto rounded border border-surface-300 {panelClass} p-3"
      >
        <!-- 見出しのみ。プッシュは枠内ヘッダー側に集約（全タブ共通の定位置）なので、ここには出さない。 -->
        <div class="flex shrink-0 items-center gap-3">
          <h3 class="inline-flex items-center gap-1 text-sm font-bold">
            <Icon icon="mdi:package-variant" class="size-4" /> オートマトンイメージ
          </h3>
        </div>

        <!-- 一覧（各行＝オートマトンイメージ）。お手本＝初期シード／手持ち＝プッシュ分（保存時刻つき）。 -->
        <ul class="flex flex-col gap-2">
          {#each registry.images as image (image.id)}
            <li class="flex items-center justify-between gap-3 rounded border border-surface-200 px-3 py-2">
              <!-- 並び＝ハッシュ（中身の指紋）／名前（タグ）／時刻 or sample。 -->
              <div class="flex min-w-0 items-center gap-2">
                <span class="font-mono text-xs opacity-60">{image.hash}</span>
                {#if renamingId === image.id}
                  <!-- インライン編集：Enter/blur で確定、Escape で取消。 -->
                  <input
                    use:autofocus
                    bind:value={renameValue}
                    onblur={commitRename}
                    onkeydown={(e) => {
                      if (e.key === "Enter") commitRename();
                      else if (e.key === "Escape") renamingId = null;
                    }}
                    class="w-32 rounded border border-surface-300 px-1 text-sm"
                  />
                {:else}
                  <span class="truncate text-sm">{image.label}</span>
                {/if}
                <span class="shrink-0 text-xs opacity-50">
                  {image.source === "preset" ? "sample" : pushedAtLabel(image.pushedAt ?? 0)}
                </span>
              </div>
              <div class="flex shrink-0 gap-2">
                <!-- プル＝Blockly に展開して編集面へ戻る（改良の起点）。
                     デプロイは行から出さず、プル→編集→オーバーレイのデプロイに一本化する。 -->
                <button class="action-btn" onclick={() => pullImage(image.program)}>
                  <Icon icon="mdi:tray-arrow-down" class="size-4" /> プル
                </button>
                <!-- リネーム＝名前（タグ）の付け替え。中身は不変。sample は読み取り専用なので無効。 -->
                <button
                  class="action-btn disabled:opacity-40"
                  disabled={image.source === "preset"}
                  onclick={() => startRename(image.id, image.label)}
                >
                  <Icon icon="mdi:pencil-outline" class="size-4" /> リネーム
                </button>
                <!-- 削除は手持ちのみ有効。sample（初期シード）は構造的に消せないので無効表示で列を揃える。 -->
                <button
                  class="action-btn disabled:opacity-40"
                  disabled={image.source === "preset"}
                  onclick={() => registry.remove(image.id)}
                >
                  <Icon icon="mdi:delete-outline" class="size-4" /> 削除
                </button>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>
