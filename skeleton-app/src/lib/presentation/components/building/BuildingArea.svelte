<script lang="ts">
  // 構築エリア＝作業台の左側。
  // タブ（ブロック編集/エディタ編集/レジストリ）＋Blockly（編集の SSoT・常時マウント）＋エディタ編集面＋レジストリ一覧を内包する。
  // アクションは「紐づく先」に置く（ライフサイクル 編集→[ビルド]→イメージ→[デプロイ/プッシュ]→ 対戦/保管）:
  //   - ビルド＋同期状態＋ロールバック＝編集内容に紐づく → 枠内右上オーバーレイ（ブロック/エディタ編集タブの時だけ。レジストリタブは非表示）
  //     （同期状態は「前回ビルド時に戻す」の有無で示す＝出ている＝ダーティー／無い＝✓ビルド済み）
  //   - カレントイメージタイル＝現在のビルド断面（ハッシュ-名前-時刻／レジストリ行と同体裁・ダーティーに依らず一定・表示専用）→ ヘッダー行の右（ビュー切替タブとレール側タブの間の空きに右寄せ）
  //   - デプロイ＝イメージを対戦へ → イメージタイルの直右（プレイ面のみ＝showDeploy）
  //   - プッシュ/リネーム/削除＝カレントイメージの保管・改名・破棄 → レジストリタブのカレント行（破線の下・保管済み行と対称）
  //   - CP/HP 配分＝起動時パラメータ（docker run 相当・イメージ非埋め込み） → ヘッダー右（イメージタイル＝マニフェスト属性と並べ常時表示・レジストリでも出す）
  // プレイ面の構築ドロワーとサンドボックスで共有し、ステージ依存・画面依存の差分は props（memoryTotal/showDeploy 等）で吸収する。
  // 2画面の見た目差は「イメージタイル直右のデプロイ1個」だけ＝サンドボックスは showDeploy=false で消える。
  import { tick } from "svelte";
  import Icon from "@iconify/svelte";
  import {
    registryImages,
    workbenchFacade,
    workbenchDraft,
    currentImage,
    cpUsed,
    draftLines,
    labelOf,
    type Program,
    type BaseImage,
  } from "$lib/application";
  import { automatonIcon, hhmm } from "$lib/presentation/utils/labels";
  import BlocklyEditor from "./BlocklyEditor.svelte";
  import BaseImageSelector from "./BaseImageSelector.svelte";
  import CapacityAllocator from "./CapacityAllocator.svelte";
  import RegistryBrowser from "./RegistryBrowser.svelte";
  import SegmentedTabs from "$lib/presentation/components/shared/SegmentedTabs.svelte";
  import ProgramViewer from "$lib/presentation/components/inspecting/ProgramViewer.svelte";

  interface BuildingAreaProps {
    // メモリ総量＝HP↔CP 配分の原資。プレイ面=stage.memoryTotal／サンドボックス=画面ローカル既定。
    // この総量をプレイヤーが HP と CP に振り分ける（CP 厚め＝複雑だが脆い）。配分は編集時のローカル状態で持つ。
    memoryTotal: number;
    // メモリ配分の刻み幅＝目盛り間隔（プレイ面=stage.memoryGrain／サンドボックス=画面ローカル既定）。CapacityAllocator へ素通しする。
    memoryGrain: number;
    // 表示中か。transform で開くドロワーは ResizeObserver が発火しないため、
    // active かつブロック編集面のとき tick 後に Blockly を明示 resize する。
    active: boolean;
    // デプロイ（編集文脈の前進）を出すか（プレイ面=true／サンドボックス=false）。
    showDeploy?: boolean;
    // デプロイ押下＝ビルド済みイメージを対戦に反映する。親（プレイ面）が対戦に流す。
    // 観戦側のイメージタイルが同じ表示名・素質を出せるよう、イメージと一緒にローカル名・素質も渡す。
    // allyHp＝HP 配分（memoryTotal − CP 割り当て）＝起動時に供給する ally の初期 HP。配分は構築側が所有するのでここで添える。
    onDeploy?: (image: Program, name: string, baseImage: BaseImage, allyHp: number) => void;
    // エディタ/レジストリ面パネルの背景クラス。このエリアを置く親の背景に合わせる。
    panelClass?: string;
  }

  let {
    memoryTotal,
    memoryGrain,
    active,
    showDeploy = false,
    onDeploy,
    panelClass = "bg-surface-50", // 既定: 薄緑地
  }: BuildingAreaProps = $props();

  // 編集中ドラフト＝アプリ層のワークベンチ store（サンドボックス⇄プレイ面で共有・画面跨ぎで保持）。
  // program／builtImage／builtAt／imageName／baseImage はこの1つの断面として持ち運ぶ。
  const draft = $derived($workbenchDraft);

  // CP 割り当て（確定値）は CapacityAllocator が所有し bind で受ける（未確定の間は子の既定が逆流して入る）。
  // HP 側＝総メモリ − CP 割り当て。デプロイ時にこの値を ally の初期 HP として親（プレイ面）へ渡す。
  let cpAllocated = $state<number>();
  const allyHp = $derived(memoryTotal - (cpAllocated ?? 0));

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

  // CP 消費量（$cpUsed）・擬似コード行（$draftLines）は workbench の読み投影を購読する
  // ＝算出（programCost/flatLines＝ドメイン）はアプリ層に閉じ、ここは購読・受け渡しだけ。
  // カレントイメージの読みモデル（未ビルド/編集乖離/指紋）＝workbench state だけの純投影（アプリ層）。
  const current = $derived($currentImage);

  // メイン領域の見出し帯＝3面共通の唯一の見出し。親が1枚だけ描画し全タブで位置を固定し、
  // 中身（アイコン＋文言）だけ面で差し替える（編集/コード＝プログラム・レジストリ＝イメージ）。
  const header = $derived(
    mainView === "registry"
      ? { icon: "mdi:package-variant", label: "オートマトンイメージ" }
      : { icon: automatonIcon("ally"), label: "プログラム" },
  );

  // 見出し帯のぶん各面に空ける余白＝帯を描く親の責務なので寸法もここで一元管理し、子へクラスで配る。
  // 縦（本体を帯の高さだけ下げる）はコード/レジストリ面、横（ラベル幅ぶんタブを右へ）はブロック編集で使う。
  // Tailwind スキャナ検出のためリテラルで持つ（子は class に差すだけ＝トークンはこの親ソースに存在する）。
  const HEADER_RESERVE_Y = "pt-12";
  const HEADER_RESERVE_X = "pl-32";

  // 名前＝ローカル名（draft.imageName）> 同一内容の既存イメージのラベル > プレースホルダ の順で解決する。
  // 同一内容ラベルの引き当ては registry スライスのセレクタ（labelOf）に委ね、反応性は $registryImages の購読で担う。
  const builtName = $derived(
    draft.imageName || (draft.builtImage ? labelOf($registryImages, draft.builtImage) : undefined) || "未保存",
  );

  // 最終ビルド時刻ラベル。ビルドが「いつの断面か」を示し、ビルドの実在を体感させる（復元点の目印）。
  const builtAtLabel = $derived(draft.builtAt === null ? null : hhmm(draft.builtAt));

  // ビルド＝現在の編集を凍結してイメージ化（試運転・デプロイの前提）。スナップショット化は facade が担う。
  function build() {
    workbenchFacade.build();
  }

  // 最新ビルドに戻す＝編集中の変更を破棄してビルド断面へ復帰（ビルドを復元点として使う）。
  // Blockly が編集の SSoT なので load() で流し込み、program が順方向で戻る。
  function revertToBuilt() {
    if (draft.builtImage === null) return;
    editor?.load(draft.builtImage);
  }

  // 表示開始／編集面復帰で Blockly の表示領域が変わる。transform で開くと ResizeObserver が
  // 発火しないため、DOM 反映（tick）後に明示 resize してスクロールバーを正す。
  $effect(() => {
    if (!active || mainView !== "edit") return;
    tick().then(() => editor?.resize());
  });

  // 画面跨ぎで持ち越したドラフトを Blockly に復元する（マウント後に一度だけ）。
  // Blockly は空で初期化され onProgramChange を発火しないため、持ち越した program は load で流し込む。
  // baseImage は inject 時に draft.baseImage で揃っており、ここでは中身（ブロック）だけ復元する。
  let hydrated = false;
  $effect(() => {
    if (hydrated || !editor) return;
    hydrated = true;
    const { program } = workbenchFacade.current();
    if (program.length > 0) editor.load(program);
  });
</script>

<!-- 構築エリア全体：ヘッダー（タブ＋ゲージ）＋メイン領域を縦に積む。 -->
<div class="flex min-h-0 flex-1 flex-col gap-3">
  <!-- ヘッダー行＝自動機のマニフェスト。高さは右レールのヘッダーと揃える。
       左＝ビュー切替タブ（副作用なしのナビ＝セグメントタブ）／右＝イメージタイル＋資源配分（属性）＋デプロイ（起動）。
       右群は ml-auto で寄せ、イメージ（成果物）→配分（起動時パラメータ）→デプロイ（起動）の順に並べる。 -->
  <div class="flex h-9 shrink-0 items-center gap-3">
    <SegmentedTabs value={mainView} items={mainTabs} onChange={(v) => (mainView = v as MainView)} />
    <div class="ml-auto flex items-center gap-2">
      <!-- カレントイメージタイル＝現在のビルド断面の表示（ハッシュ-名前-ビルド時刻／レジストリ行と同体裁・表示専用）。
           ダーティーに依らず一定。改名・プッシュ・削除はレジストリタブのカレント行に集約する。 -->
      {#if current.notBuilt}
        <span
          class="inline-flex items-center gap-1.5 rounded border border-dashed border-surface-300 px-2 py-1 w-36 text-xs text-surface-400"
        >
          <Icon icon="mdi:cube-outline" class="size-4" aria-label="未ビルド" />
          未ビルド
        </span>
      {:else}
        <span
          class="inline-flex items-center gap-1.5 rounded border border-surface-300 bg-surface-50 px-2 py-1 w-36 text-xs text-surface-700"
        >
          <Icon icon="mdi:cube" class="size-4" aria-label="カレントイメージ" />
          <!-- 名前は表示専用。改名はレジストリタブのカレント行に一本化する。 -->
          <span class="max-w-[8rem] truncate font-medium">{builtName}</span>
          <span class="opacity-70">{builtAtLabel}</span>
        </span>
      {/if}
      <!-- 資源配分（CP/HP）＝起動時パラメータ（docker run 相当）。イメージには焼かれず起動時に供給される属性なので、
           イメージタイルと並べてマニフェストとして常時出す（ブロック/エディタ/レジストリ問わず・サンドボックスでも）。 -->
      <CapacityAllocator cpUsed={$cpUsed} {memoryTotal} {memoryGrain} bind:cpAllocated />
      {#if showDeploy}
        <!-- デプロイ＝ビルド済みイメージを対戦に反映（タイルの直右＝操作対象の真横）。未ビルドは押せない。
             副作用のある命令なのでビルドと同じ強調色（action-btn-strong）で揃える。 -->
        <button
          class="action-btn-strong disabled:opacity-40"
          onclick={() => draft.builtImage && onDeploy?.(draft.builtImage, builtName, draft.baseImage, allyHp)}
          disabled={current.notBuilt}
          title={current.notBuilt ? "先にビルド" : "ビルド済みイメージを対戦に反映"}
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
      <!-- 選んだ素質がパレットに出せるブロックを決める（上部のベースイメージ選択と連動）。 -->
      <BlocklyEditor
        bind:this={editor}
        baseImage={draft.baseImage}
        onProgramChange={(p) => workbenchFacade.setProgram(p)}
        headerReserve={HEADER_RESERVE_X}
      />
    </div>

    <!-- 編集文脈のオーバーレイ群＝編集内容に紐づく操作（ビルド/素質切替）なので枠内に重ねる。
         これらは draft を変える「アクション」なのでブロック/エディタ編集でだけ出し、レジストリ（保管の文脈）では隠す。
         一方 CP/HP 配分は draft の「属性」なのでヘッダー（マニフェスト）に常時出す＝ここには含めない。
         配置は親（BuildingArea）の責務・各中身はそれぞれの子に閉じる。 -->
    {#if mainView !== "registry"}
      <!-- 素質セレクタ＝ビルドの入力「何から作るか」。右上のビルドボタン直下（旧 CP ゲージの位置）に置く。
           ビルドの入力なのでビルド動線（ビルドボタン）の近くに縦に並べる。
           選んだ素質が BlocklyEditor のパレット（出せるブロック）を切り替える＝コマンド解放の seam。
           非互換切替のときだけ Blockly を空にする＝編集の SSoT はここの editor なので onClear で受ける。 -->
      <div class="absolute right-5 top-15 z-20">
        <BaseImageSelector onClear={() => editor?.load([])} />
      </div>

      <!-- ビルド＋同期操作：右上。ダーティー表示は専用ラベルを持たず、「前回ビルド時に戻す」が出ている事自体が
           ダーティーの合図＝戻すが無い（＝編集とビルド断面が一致）＝「ビルド済み（最新）」を✓で示す。 -->
      <div class="absolute right-5 top-2 z-20 flex items-center gap-2">
        {#if current.dirty}
          <!-- ロールバック＝編集を捨てて前回ビルド時へ戻す。この表示自体がダーティーの合図。破壊寄りなので淡色。 -->
          <button class="action-btn" onclick={revertToBuilt} title="編集を捨てて前回ビルド時に戻す">
            <Icon icon="mdi:history" class="size-4" /> 前回ビルドに戻す
          </button>
        {:else if !current.notBuilt}
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
      <!-- エディタ編集面（フル領域）：ブロックから生成したコードを表示（読み取り専用）。枠色は surface 系で揃える。
           見出しは親が描く帯なので持たず、本体を pt-12 下げて上端をブロック編集のキャンバス上端に揃える。 -->
      <div class="absolute inset-0 flex flex-col overflow-hidden rounded border border-surface-300 {panelClass}">
        <!-- 本体：生成コード（読み取り専用）。fill を効かせるため親を flex コンテナにする。上端は帯のぶん下げる。 -->
        <div class="flex min-h-0 flex-1 flex-col {HEADER_RESERVE_Y}">
          <ProgramViewer lines={$draftLines} activeId={undefined} fill />
        </div>
      </div>
    {/if}

    {#if mainView === "registry"}
      <!-- レジストリ管理面（フル領域）。一覧/pull/rename/push は RegistryBrowser に閉じる。
           pull 時の Blockly 流し込みだけは編集の SSoT がここの editor なので onPull で受ける。 -->
      <RegistryBrowser {panelClass} headerReserve={HEADER_RESERVE_Y} onPull={(program) => editor?.load(program)} />
    {/if}

    <!-- メイン領域の見出し帯＝3面で位置を固定する唯一の見出し。各面の枠の上に1枚だけ重ねて描き、
         中身だけ面で差し替える。ブロック編集ではパレット行の pl-28 が空けた場所に横並びで収まる。
         クリックを吸わないよう pointer-events-none（タブ/操作ボタンは下層で生きる）。 -->
    <span class="pointer-events-none absolute left-3 top-3 z-30 inline-flex items-center gap-1 text-sm font-bold">
      <Icon icon={header.icon} class="size-4" />
      {header.label}
    </span>
  </div>
</div>
