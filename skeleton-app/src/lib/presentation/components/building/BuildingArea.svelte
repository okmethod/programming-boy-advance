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
  // プレイ面の構築ドロワーとサンドボックスで共有し、ステージ依存・画面依存の差分は props（memoryTotal/showDeploy 等）で吸収する。
  // 2画面の見た目差は「イメージタイル直右のデプロイ1個」だけ＝サンドボックスは showDeploy=false で消える。
  import { tick } from "svelte";
  import Icon from "@iconify/svelte";
  import { programCost, baseImageTag, baseImageSupports, type BaseImage, type Program } from "$lib/domain";
  import { registryImages, workbenchFacade, workbenchDraft } from "$lib/application";
  import { registryFacade } from "$lib/presentation/composition";
  import { automatonIcon } from "$lib/presentation/utils/labels";
  import BlocklyEditor from "./BlocklyEditor.svelte";
  import BaseImageSelectModal from "./BaseImageSelectModal.svelte";
  import CapacityAllocator from "./CapacityAllocator.svelte";
  import RegistryBrowser from "./RegistryBrowser.svelte";
  import SegmentedTabs from "$lib/presentation/components/shared/SegmentedTabs.svelte";
  import ProgramViewer from "$lib/presentation/components/inspecting/ProgramViewer.svelte";

  interface BuildingAreaProps {
    // 総メモリ＝HP↔CP 配分の原資。プレイ面=stage.capacity／レジストリ管理=既定容量。
    // この総量をプレイヤーが HP と CP に振り分ける（CP 厚め＝複雑だが脆い）。配分は編集時のローカル状態で持つ。
    memoryTotal: number;
    // 表示中か。transform で開くドロワーは ResizeObserver が発火しないため、
    // active かつブロック編集面のとき tick 後に Blockly を明示 resize する。
    active: boolean;
    // デプロイ（編集文脈の前進）を出すか（プレイ面=true／サンドボックス=false）。
    showDeploy?: boolean;
    // デプロイ押下＝ビルド済みイメージを対戦に反映する。親（プレイ面）が対戦に流す。
    // 観戦側のイメージタイルが同じ表示名を出せるよう、イメージと一緒にローカル名も渡す。
    onDeploy?: (image: Program, name: string) => void;
    // エディタ/レジストリ面パネルの背景クラス。このエリアを置く親の背景に合わせる。
    panelClass?: string;
  }

  let {
    memoryTotal,
    active,
    showDeploy = false,
    onDeploy,
    panelClass = "bg-surface-50", // 既定: 薄緑地
  }: BuildingAreaProps = $props();

  // 編集中ドラフト＝アプリ層のワークベンチ store（サンドボックス⇄プレイ面で共有・画面跨ぎで保持）。
  // program／builtImage／builtAt／imageName／baseImage はこの1つの断面として持ち運ぶ。
  const draft = $derived($workbenchDraft);

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

  // 編集中に土台とする素質（系統×版）はドラフト（draft.baseImage）が持つ。
  // 付与命令セットがパレットに出せるブロックを決める。
  // 選択は「どちらを選ぶと何が解放されるか」を見て決められるよう、2軸モーダルに委ねる。
  let baseModalOpen = $state(false);
  function selectBaseImage(base: BaseImage) {
    // 非互換切替＝使えなくなるブロックが残ると不整合になるため、編集中プログラムを全クリアしてから乗り換える
    // （破棄の同意はモーダル側の確認で取得済み）。Blockly が編集の SSoT なので load([]) で空にする。
    if (!baseImageSupports(base, draft.program)) editor?.load([]);
    workbenchFacade.setBaseImage(base);
    baseModalOpen = false;
  }

  // CP（作成予算）の消費量。組んだブロック数から算出する（戦闘状態とは独立）。
  // メモリ配分（CP↔HP）と CP 上限は CapacityControl に閉じ込め、ここは消費量だけを渡す。
  const cpUsed = $derived(programCost(draft.program));

  // ビルド状態：未ビルド（null）か、ビルド後に編集が乖離したか（要ビルド）。
  // 命令木は素直な JSON 構造なので文字列化比較で十分（YAGNI）。
  const notBuilt = $derived(draft.builtImage === null);
  const dirty = $derived(
    draft.builtImage !== null && JSON.stringify(draft.program) !== JSON.stringify(draft.builtImage),
  );

  // 最終ビルド時刻ラベル。ビルドが「いつの断面か」を示し、ビルドの実在を体感させる（復元点の目印）。
  const builtAtLabel = $derived(
    draft.builtAt === null
      ? null
      : new Date(draft.builtAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
  );

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

  // ヘッダーのカレントイメージタイルに出す表示名／ハッシュ。
  // 名前＝ローカル名（draft.imageName）> 同一内容の既存イメージのラベル > プレースホルダ の順で解決する。
  // 同一内容の既存イメージは facade.duplicateOf（非追跡の一発読み）なので、$registryImages 購読でレジストリ変化にも追従する。
  const duplicate = $derived.by(() => {
    void $registryImages;
    return draft.builtImage !== null ? registryFacade.duplicateOf(draft.builtImage) : undefined;
  });
  const builtName = $derived(draft.imageName || duplicate?.label || "未保存イメージ");
  // カレントイメージの内容ハッシュ（レジストリ行と同じ指紋）。未ビルドは無し。
  const builtHash = $derived(draft.builtImage === null ? null : registryFacade.hashOf(draft.builtImage));

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
  <!-- ヘッダー行：高さは右レールのヘッダーと揃える。
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
          onclick={() => draft.builtImage && onDeploy?.(draft.builtImage, builtName)}
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
      <!-- 選んだ素質がパレットに出せるブロックを決める（上部のベースイメージ選択と連動）。 -->
      <BlocklyEditor
        bind:this={editor}
        baseImage={draft.baseImage}
        onProgramChange={(p) => workbenchFacade.setProgram(p)}
      />
    </div>

    <!-- CP ゲージ＝編集中プログラムの作成予算。
         枠内のコード/キャンバス領域に収まるよう、ビルドボタンのやや下・右揃え（同じ right）でオーバーレイする。
         ブロック編集・エディタ編集で同じ位置に出し、レジストリでは隠す。
         エディタ編集面のコードは暗地（gray-900）なので、淡色チップに載せてどちらの面でも読めるようにする。 -->
    {#if mainView !== "registry"}
      <!-- 配置（右上オーバーレイ）は BuildingArea の責務。チップ本体と配分操作は CapacityAllocator に閉じる。 -->
      <div class="absolute right-5 top-15 z-20">
        <CapacityAllocator {cpUsed} {memoryTotal} />
      </div>
    {/if}

    <!-- ビルド＋同期操作：メイン領域の右上にオーバーラップ（編集内容に紐づくので枠内）。編集文脈＝ブロック/エディタ編集タブの時だけ出す。
         レジストリタブは保管の文脈なのでビルド含め非表示（改名/削除/プッシュはカレント行に集約）。
         ダーティー表示は専用ラベルを持たず、「前回ビルド時に戻す」が出ている事自体がダーティーの合図＝
         戻すが無い（＝編集とビルド断面が一致）＝「ビルド済み（最新）」を✓で示す。 -->
    <!-- ベースイメージ選択（素質＝系統×版）＝ビルド時の新ギミック其の一。コマンド解放の土台を選ぶ口。
         編集文脈（ブロック/エディタ編集）でだけ出す＝ビルド/CP ゲージと同条件。レジストリ（保管）では隠す。
         ビルドの入力＝「何から作るか」なので、エディタ領域の上部中央（ビルドボタンの左）に置く。
         選んだ素質が BlocklyEditor のパレット（出せるブロック）を実際に切り替える＝コマンド解放の seam。 -->
    {#if mainView !== "registry"}
      <!-- トリガ＝現在のベースイメージ（系統アイコン＋タグ）。押すと2軸モーダルで解放内容を見て選び直せる。 -->
      <div class="absolute left-1/2 top-2 z-20 -translate-x-1/2">
        <button
          type="button"
          onclick={() => (baseModalOpen = true)}
          class="inline-flex items-center gap-1.5 rounded border border-surface-300 bg-surface-50/95 px-2 py-1 text-xs text-surface-700 shadow-sm hover:bg-surface-100"
          title="ベースイメージ（素質）を選ぶ"
        >
          <Icon icon={draft.baseImage.icon} class="size-4 text-success-700" aria-label="素質" />
          <span class="font-mono opacity-70">{baseImageTag(draft.baseImage)}</span>
          <Icon icon="mdi:chevron-down" class="size-4 opacity-50" />
        </button>
      </div>
    {/if}

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
          program={draft.program}
          activeId={undefined}
          fill
          bodyClass="mt-3"
        />
      </div>
    {/if}

    {#if mainView === "registry"}
      <!-- レジストリ管理面（フル領域）。一覧/pull/rename/push は RegistryBrowser に閉じる。
           pull 時の Blockly 流し込みだけは編集の SSoT がここの editor なので onPull で受ける。 -->
      <RegistryBrowser {panelClass} onPull={(program) => editor?.load(program)} />
    {/if}
  </div>
</div>

<!-- ベースイメージ選択（2軸モーダル）。系統×版を見比べ、確定で素質を乗り換える＝パレット（出せるブロック）が追従する。 -->
<BaseImageSelectModal
  open={baseModalOpen}
  selected={draft.baseImage}
  program={draft.program}
  onSelect={selectBaseImage}
  onClose={() => (baseModalOpen = false)}
/>
