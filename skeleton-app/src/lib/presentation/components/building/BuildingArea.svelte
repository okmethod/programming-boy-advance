<script lang="ts">
  // 構築エリア＝作業台の左側。
  // タブ（ブロック編集/エディタ編集/レジストリ）＋Blockly（編集の SSoT・常時マウント）＋エディタ編集面＋レジストリ一覧を内包する。
  // アクションは「紐づく先」に置く（ライフサイクル 編集→[ビルド]→イメージ→[デプロイ/プッシュ]→ 対戦/保管）:
  //   - ビルド＋同期状態＋ロールバック＝編集内容に紐づく → 枠内右上オーバーレイ（ブロック/エディタ編集タブの時だけ。レジストリタブは非表示）
  //     （同期状態は「前回ビルド時に戻す」の有無で示す＝出ている＝ダーティー／無い＝✓ビルド済み）
  //   - カレントイメージタイル＝現在のビルド断面（ハッシュ-名前-時刻／レジストリ行と同体裁・ダーティーに依らず一定・表示専用）→ ヘッダー行の右（ビュー切替タブとレール側タブの間の空きに右寄せ）
  //   - デプロイ＝イメージを対戦へ → イメージタイルの直右（プレイ面のみ＝showDeploy）
  //   - プッシュ/リネーム/削除＝カレントイメージの保管・改名・破棄 → レジストリタブのカレント行（破線の下・保管済み行と対称）
  //   - CP ゲージ＝編集予算 → 枠内ヘッダー帯の中央オーバーレイ（ブロック/エディタ編集で同位置・レジストリでは隠す）
  // プレイ面の構築ドロワーとサンドボックスで共有し、ステージ依存・画面依存の差分は props（cpLimit/showDeploy 等）で吸収する。
  // 2画面の見た目差は「イメージタイル直右のデプロイ1個」だけ＝サンドボックスは showDeploy=false で消える。
  import { tick } from "svelte";
  import Icon from "@iconify/svelte";
  import { programCost, type Program } from "$lib/domain";
  import { registry, type RegistryImage } from "$lib/presentation/stores/registryStore.svelte";
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

  // カレントイメージを破棄＝未ビルドに戻す（編集中の Blockly はそのまま・凍結した断面だけ捨てる）。
  function clearBuiltImage() {
    builtImage = null;
    builtAt = null;
    imageName = "";
  }

  // ビルド済みイメージと同一内容の既存イメージ（あれば＝プッシュ不要）。未ビルドは対象外。
  const duplicate = $derived(builtImage !== null ? registry.duplicateOf(builtImage) : undefined);
  const alreadyPushed = $derived(duplicate !== undefined);

  // カレントイメージのローカル名。push 前から付けられ、push 時にこの名前で保管する。
  // 改良（再ビルド）では保持し、別イメージを pull したらその名前へ乗り換える（＝自分のオートマトンに名を付けて育てる）。
  let imageName = $state("");
  // タイルに出す表示名。ローカル名 > 同一内容の既存イメージのラベル > プレースホルダ の順で解決する。
  const builtName = $derived(imageName || duplicate?.label || "未保存イメージ");
  // カレントイメージの内容ハッシュ（レジストリ行と同じ指紋）。未ビルドは無し。
  const builtHash = $derived(builtImage === null ? null : registry.hashOf(builtImage));

  // プッシュ＝ビルド済みイメージをレジストリに保存（ローカル名で保管）。生の編集ではなくビルド断面を積む。
  function pushImage() {
    if (builtImage === null) return;
    registry.push(builtImage, imageName);
  }

  // プル＝レジストリのイメージをカレント（ビルド断面）に取り込む。改良の起点。
  // 編集内容（Blockly）も同じ断面に合わせてダーティーを出さず、タブは切り替えない（カレントが更新されるだけ）。
  // 時刻はイメージの保存時刻（お手本は保存時刻を持たないので現在時刻）。
  function pullImage(image: RegistryImage) {
    editor?.load(image.program);
    builtImage = image.program;
    builtAt = image.pushedAt ?? Date.now();
    imageName = image.label;
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

  // カレントイメージ名のインライン改名（タイル）。ローカル名を編集し、同一内容が push 済み手持ちなら
  // その登録名も合わせて更新する（一覧と齟齬が出ないように）。入力値は一覧の改名と共有（同時編集はしない）。
  let tileRenaming = $state(false);
  function startTileRename() {
    renameValue = imageName || duplicate?.label || "";
    tileRenaming = true;
  }
  function commitTileRename() {
    const name = renameValue.trim();
    if (name.length > 0) {
      imageName = name;
      if (duplicate?.source === "user") registry.rename(duplicate.id, name);
    }
    tileRenaming = false;
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
       左＝ビュー切替タブ（副作用なしのナビ＝セグメントタブ）／右＝カレントイメージタイル＋デプロイ。
       タイルはビュー切替タブとレール側タブの間の空きに ml-auto で右寄せし、ビルドの鮮度を畳み込む。 -->
  <div class="flex h-9 shrink-0 items-center gap-3">
    <SegmentedTabs value={mainView} items={mainTabs} onChange={(v) => (mainView = v as MainView)} />
    <div class="ml-auto flex items-center gap-2">
      <!-- カレントイメージタイル＝現在のビルド断面の表示（ハッシュ-名前-ビルド時刻／レジストリ行と同体裁・表示専用）。
           ダーティーに依らず一定。改名・プッシュ・削除はレジストリタブのカレント行に集約する。 -->
      {#if notBuilt}
        <span
          class="inline-flex items-center gap-1.5 rounded border border-dashed border-surface-300 px-2 py-1 text-xs text-surface-400"
        >
          <Icon icon="mdi:cube-outline" class="size-4" aria-label="未ビルド" />
          未ビルド
        </span>
      {:else}
        <span
          class="inline-flex items-center gap-1.5 rounded border border-surface-300 bg-surface-50 px-2 py-1 text-xs text-surface-700"
        >
          <Icon icon="mdi:cube" class="size-4" aria-label="カレントイメージ" />
          <span class="font-mono opacity-60">{builtHash}</span>
          <!-- 名前は表示専用。改名はレジストリタブのカレント行に一本化する。 -->
          <span class="max-w-[8rem] truncate font-medium">{builtName}</span>
          <span class="opacity-70">{builtAtLabel}</span>
        </span>
      {/if}
      {#if showDeploy}
        <!-- デプロイ＝ビルド済みイメージを対戦に反映（タイルの直右＝操作対象の真横）。未ビルドは押せない。
             副作用のある命令なのでビルドと同じ強調色（action-btn-strong）で揃える。 -->
        <button
          class="action-btn-strong disabled:opacity-40"
          onclick={() => builtImage && onDeploy?.(builtImage)}
          disabled={notBuilt}
          title={notBuilt ? "先にビルド" : "ビルド済みイメージを対戦に反映"}
        >
          <Icon icon="mdi:rocket-launch-outline" class="size-4" /> デプロイ
        </button>
      {/if}
    </div>
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
         枠内のコード/キャンバス領域に収まるよう、ビルドボタンのやや下・右揃え（同じ right）でオーバーレイする。
         ブロック編集・エディタ編集で同じ位置に出し、レジストリでは隠す。
         エディタ編集面のコードは暗地（gray-900）なので、淡色チップに載せてどちらの面でも読めるようにする。 -->
    {#if mainView !== "registry"}
      <div
        class="absolute right-5 top-15 z-20 rounded border border-surface-300 bg-surface-50/95 px-2 py-0.5 shadow-sm"
      >
        <CapacityGauge used={cpUsed} limit={cpLimit} />
      </div>
    {/if}

    <!-- ビルド＋同期操作：メイン領域の右上にオーバーラップ（編集内容に紐づくので枠内）。編集文脈＝ブロック/エディタ編集タブの時だけ出す。
         レジストリタブは保管の文脈なのでビルド含め非表示（改名/削除/プッシュはカレント行に集約）。
         ダーティー表示は専用ラベルを持たず、「前回ビルド時に戻す」が出ている事自体がダーティーの合図＝
         戻すが無い（＝編集とビルド断面が一致）＝「ビルド済み（最新）」を✓で示す。 -->
    {#if mainView !== "registry"}
      <div class="absolute right-5 top-2 z-20 flex items-center gap-2">
        {#if dirty}
          <!-- ロールバック＝編集を捨てて前回ビルド時へ戻す。この表示自体がダーティーの合図。破壊寄りなので淡色。 -->
          <button class="action-btn" onclick={revertToBuilt} title="編集を捨てて前回ビルド時に戻す">
            <Icon icon="mdi:history" class="size-4" /> 前回ビルドに戻す
          </button>
        {:else if !notBuilt}
          <!-- 戻すが無い＝編集とビルド断面が一致＝ビルド済み（最新）。 -->
          <span class="inline-flex items-center gap-1 text-xs text-success-700">
            <Icon icon="mdi:check-circle" class="size-4" /> ビルド済み
          </span>
        {/if}
        <button class="action-btn-strong" onclick={build}>
          <Icon icon="mdi:wrench" class="size-4" /> ビルド
        </button>
      </div>
    {/if}

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
      <!-- レジストリ管理面（フル領域）。上＝保管済み一覧（pull/リネーム/削除）／破線／下＝カレント行（push）。
           下→上 push・上→下 pull で矢印の向きと空間が一致。永続化・版管理は未着手（store 側に集約）。 -->
      <div
        class="absolute inset-0 flex flex-col gap-3 overflow-hidden rounded border border-surface-300 {panelClass} p-3"
      >
        <!-- 見出し（プッシュは下のカレント行へ移設）。 -->
        <div class="flex shrink-0 items-center gap-3">
          <h3 class="inline-flex items-center gap-1 text-sm font-bold">
            <Icon icon="mdi:package-variant" class="size-4" /> オートマトンイメージ
          </h3>
        </div>

        <!-- レジストリ領域（保管済み）：小見出し＋一覧。残り高を占め、一覧だけ内側スクロール。下のカレント行は常に見える。 -->
        <div class="flex min-h-0 flex-1 flex-col gap-1">
          <span class="shrink-0 text-xs font-bold text-surface-500">レジストリ</span>
          <!-- 一覧（各行＝オートマトンイメージ）。お手本＝初期シード／手持ち＝プッシュ分（保存時刻つき）。 -->
          <ul class="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
            {#each registry.images as image (image.id)}
              <li class="flex h-12 items-center justify-between gap-3 rounded border border-surface-200 px-3">
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
                  <button class="action-btn-strong" onclick={() => pullImage(image)}>
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

        <!-- 破線区切り：上＝レジストリ（保管済み）／下＝カレント（これから push する対象）。
             下→上へプッシュ（⬆）・上→下へプル（⬇）＝矢印の向きと空間配置が一致する。 -->
        <div class="shrink-0 border-t border-dashed border-surface-300"></div>

        <!-- カレント領域：小見出し＋カレント行。 -->
        <div class="flex shrink-0 flex-col gap-1">
          <span class="shrink-0 text-xs font-bold text-surface-500">カレント</span>
          <!-- 固定高 h-12＝状態（未ビルド／ビルド済み／改名入力中）で縦幅が変わらないよう揃える。
               中身は items-center で中央寄せ（ボタンや入力の高さに引っ張られない）。 -->
          <div
            class="flex h-12 shrink-0 items-center justify-between gap-3 rounded border border-surface-300 bg-surface-50 px-3"
          >
            {#if notBuilt}
              <span class="inline-flex items-center gap-2 text-sm text-surface-400">
                <Icon icon="mdi:cube-outline" class="size-4" /> 未ビルド
              </span>
            {:else}
              <!-- カレント＝現在のビルド断面。保管済み行と同じ体裁（ハッシュ-名前-時刻）＋対称の操作列。 -->
              <div class="flex min-w-0 items-center gap-2">
                <Icon icon="mdi:cube" class="size-4 opacity-70" aria-label="カレント" />
                <span class="font-mono text-xs opacity-60">{builtHash}</span>
                {#if tileRenaming}
                  <!-- インライン改名：Enter/blur で確定・Escape で取消。 -->
                  <input
                    use:autofocus
                    bind:value={renameValue}
                    onblur={commitTileRename}
                    onkeydown={(e) => {
                      if (e.key === "Enter") commitTileRename();
                      else if (e.key === "Escape") tileRenaming = false;
                    }}
                    class="w-32 rounded border border-surface-300 px-1 text-sm"
                  />
                {:else}
                  <span class="truncate text-sm">{builtName}</span>
                {/if}
                <span class="shrink-0 text-xs opacity-50">{builtAtLabel}</span>
              </div>
              <!-- 操作列：保管済み行（プル/リネーム/削除）と対称に プッシュ/リネーム/削除。 -->
              <div class="flex shrink-0 gap-2">
                <!-- プッシュ＝カレントをレジストリ（上）へ保管。同一内容が登録済みなら重複を積まない。 -->
                <button
                  class="action-btn-strong disabled:opacity-40"
                  onclick={pushImage}
                  disabled={alreadyPushed}
                  title={alreadyPushed ? `「${duplicate?.label}」と重複` : "ビルド済みイメージをレジストリに保存"}
                >
                  <Icon icon="mdi:tray-arrow-up" class="size-4" /> プッシュ
                </button>
                <!-- リネーム＝カレントイメージ名の付け替え（ローカル名。push 済みならレジストリ label も同期）。 -->
                <button class="action-btn" onclick={startTileRename}>
                  <Icon icon="mdi:pencil-outline" class="size-4" /> リネーム
                </button>
                <!-- 削除＝カレントイメージを破棄して未ビルドに戻す（編集中の Blockly はそのまま）。 -->
                <button class="action-btn" onclick={clearBuiltImage} title="カレントイメージを破棄（未ビルドに戻す）">
                  <Icon icon="mdi:delete-outline" class="size-4" /> 削除
                </button>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
