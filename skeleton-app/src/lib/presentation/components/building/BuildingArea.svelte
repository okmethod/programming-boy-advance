<script lang="ts">
  // 構築エリア＝作業台の左側。
  // タブ（ブロック編集/エディタ編集/レジストリ）＋Blockly（編集の SSoT・常時マウント）＋エディタ編集面＋レジストリ一覧を内包する。
  // アクションは「紐づく先」に置く（ライフサイクル 編集→[ビルド]→イメージ→[デプロイ/プッシュ]→ 対戦/保管）:
  //   - ビルド＋同期状態＋ロールバック＝編集内容に紐づく → 枠内右上オーバーレイ（ブロック/エディタ編集タブの両面で出す。レジストリタブは非表示）
  //     （同期状態は「前回ビルド時に戻す」の有無で示す＝出ている＝ダーティー／無い＝✓ビルド済み）
  //   - カレントイメージタイル＝現在のビルド断面（ハッシュ-名前-時刻／レジストリ行と同体裁・ダーティーに依らず一定・表示専用）→ ヘッダー行の右（ビュー切替タブとレール側タブの間の空きに右寄せ）
  //   - デプロイ＝イメージを対戦へ → イメージタイルの直右（プレイ面のみ＝showDeploy）
  //   - プッシュ/リネーム/削除＝カレントイメージの保管・改名・破棄 → レジストリタブのカレント行（破線の下・保管済み行と対称）
  //   - CP/HP 配分＝起動時パラメータ（docker run 相当・イメージ非埋め込み） → ヘッダー右（イメージタイル＝マニフェスト属性と並べ常時表示・レジストリでも出す）
  // プレイ面の構築ドロワーとサンドボックスで共有し、ステージ依存・画面依存の差分は props（memoryTotal/showDeploy 等）で吸収する。
  // 2画面の見た目差は「イメージタイル直右のデプロイ1個」だけ＝サンドボックスは showDeploy=false で消える。
  import { tick, untrack } from "svelte";
  import Icon from "@iconify/svelte";
  import {
    registryImages,
    workbenchFacade,
    workbenchDraft,
    currentImage,
    cpUsed,
    draftText,
    builtLines,
    labelOf,
    type AutomatonImage,
    type BaseImage,
    type ParseError,
    type NodeId,
  } from "#lib/application";
  import { automatonIcon, hhmm } from "#lib/presentation/utils/labels";
  import { emitFeedback } from "#lib/presentation/feedbacks";
  import BlocklyEditor from "./BlocklyEditor.svelte";
  import BaseImageSelector from "./BaseImageSelector.svelte";
  import CapacityAllocator from "./CapacityAllocator.svelte";
  import RegistryBrowser from "./RegistryBrowser.svelte";
  import SegmentedTabs from "#lib/presentation/components/shared/SegmentedTabs.svelte";
  import ProgramEditor from "./ProgramEditor.svelte";
  import ProgramViewer from "#lib/presentation/components/inspecting/ProgramViewer.svelte";

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
    // イメージ（program＋素質の運搬単位）と一緒にローカル名を渡す＝観戦側のイメージタイルが同じ表示名・素質を出せる。
    // allyHp＝HP 配分（memoryTotal − CP 割り当て）＝起動時に供給する ally の初期 HP。配分は構築側が所有するのでここで添える。
    onDeploy?: (image: AutomatonImage, name: string, allyHp: number) => void;
    // エディタ/レジストリ面パネルの背景クラス。このエリアを置く親の背景に合わせる。
    panelClass?: string;
    // 試運転が再生中か（親＝ページが SandboxRail から中継）。再生開始でコード面を観戦表示へ切り替えるトリガー。
    sandboxPlaying?: boolean;
    // 試運転で ally が実行中の命令ノード id（親が中継）。コード面の観戦オーバーレイのハイライトに素通しする。
    sandboxActiveId?: NodeId;
    // プレイヤーが選べる素質の許可集合（未指定で無制限）。BaseImageSelector のカタログ絞り込みに素通しする。
    allowedImages?: readonly BaseImage[];
  }

  let {
    memoryTotal,
    memoryGrain,
    active,
    showDeploy = false,
    onDeploy,
    panelClass = "bg-surface-50", // 既定: 薄緑地
    sandboxPlaying = false,
    sandboxActiveId,
    allowedImages,
  }: BuildingAreaProps = $props();

  // 編集中ドラフト＝アプリ層のワークベンチ store（サンドボックス⇄プレイ面で共有・画面跨ぎで保持）。
  // program／builtImage／builtAt／imageName／baseImage はこの1つの断面として持ち運ぶ。
  const draft = $derived($workbenchDraft);

  // CP 割り当て（確定値）＝HP↔CP 配分の確定。親が所有し CapacityAllocator へ bind で渡す（スライダ操作で更新される）。
  // bind 先は undefined を取れない（子の bindable 既定と衝突する）ため、ここで初期値を確定しておく：
  // 使用ブロック数を含む最小目盛りを可動域 [grain, total-grain] へクランプ（子の既定と同じ式）。
  // HP 側＝総メモリ − CP 割り当て。デプロイ時にこの値を ally の初期 HP として親（プレイ面）へ渡す。
  let cpAllocated = $state(
    untrack(() =>
      Math.min(memoryTotal - memoryGrain, Math.max(memoryGrain, Math.ceil($cpUsed / memoryGrain) * memoryGrain)),
    ),
  );
  const allyHp = $derived(memoryTotal - cpAllocated);

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

  // エディタ編集（code モード）中はテキスト側に「編集の SSoT」が移る（ブロック編集では Blockly が SSoT）。
  // 構文エラーがある間は確定（タブ切替・ビルド）をブロックする＝有効な Program だけを下流に流す。
  // 逆変換は workbench facade（setProgramFromText）に閉じ、ここは入力テキストを委ねて結果のエラーを受けるだけ。
  let codeErrors = $state<readonly ParseError[]>([]);
  const codeHasErrors = $derived(codeErrors.length > 0);

  // エディタ編集面を「試運転の観戦（ビルド断面＋実行行ハイライト）」に切り替えているか。
  // 試運転が走るのはビルド断面なので、観戦中は編集テキストではなく builtLines を正として見せる。
  // 切替規則は非対称：再生が始まったら自動で観戦へ入り、戻るのは明示（「編集を再開」ボタン）＝勝手に編集へ戻らない。
  let codeViewing = $state(false);
  // 再生開始（false→true）の立ち上がりだけを拾う。保持変数は追跡不要なので $state にしない（自己再発火を避ける）。
  let wasSandboxPlaying = false;
  $effect(() => {
    const playing = sandboxPlaying;
    // コード面にいる時だけ観戦へ切り替える（ブロック編集は別機構＝対象外）。
    if (playing && !wasSandboxPlaying && mainView === "code") codeViewing = true;
    wasSandboxPlaying = playing;
  });

  // code 面に流れた最新テキストの控え。テキストは ProgramEditor のローカルが権威で親は持たないため、
  // 素質変更時に「現テキストを新素質で再検証」する材料としてここに写す（入場・リシードで種を入れる）。
  let lastCodeText = $state("");

  // テキスト入力を facade に委ねて program へ反映し、構文エラー／素質外命令の有無を手元に受ける（確定ブロック判断用）。
  function applyCodeText(text: string) {
    lastCodeText = text;
    const result = workbenchFacade.setProgramFromText(text);
    codeErrors = result.ok ? [] : result.errors;
  }

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
    emitFeedback("build");
  }

  // デプロイ＝ビルド済みイメージを対戦に反映（状態遷移は親の onDeploy が担う。ここは出撃の一打を鳴らす）。
  function deploy() {
    if (!draft.builtImage) return;
    emitFeedback("deploy");
    // ビルド断面（builtImage＝program＋凍結した素質）をそのまま運搬単位として渡す＝ビルド後に乗り換えた素質を引きずらない。
    onDeploy?.(draft.builtImage, builtName, allyHp);
  }

  // エディタ編集面を種から貼り直すための nonce。ProgramEditor はテキストを初期値限りで取り以後ローカル保持するため、
  // ロールバックのような「意図した破棄」では remount して現在の $draftText（＝戻した断面）を種に取り直させる。
  let codeSeedNonce = $state(0);

  // 最新ビルドに戻す＝編集中の変更を破棄してビルド断面へ復帰（ビルドを復元点として使う）。
  // 状態遷移（program ← builtImage）はアプリ層の操作なので、ビューの追従だけをここで権威別に担う：
  //  - ブロック編集：program は Blockly が SSoT。load() で流し込むと onProgramChange が順方向で同じ戻しを起こす（program の facade 直書きはしない＝二重 write 回避）。
  //    ただし素質（baseImage）は Blockly が持たず順方向に流れないため、断面の素質へ facade で別途戻す（パレットが追従する）。
  //  - エディタ編集：テキスト欄は dumb leaf で順方向に流せない。facade で store（program／baseImage）を戻し、エラーを払って ProgramEditor を種から貼り直す。
  function revertToBuilt() {
    const built = draft.builtImage;
    if (built === null) return;
    emitFeedback("revert");
    if (mainView === "code") {
      workbenchFacade.revertToBuilt();
      codeErrors = [];
      lastCodeText = $draftText; // 戻した断面を再検証の種に据え直す（ProgramEditor も同じ $draftText で貼り直す）。
      codeSeedNonce++;
      return;
    }
    workbenchFacade.setBaseImage(built.baseImage);
    editor?.load(built.program);
  }

  // ビュー切替。code モードを離れるときだけ 2 つ効く：
  //  1) 構文エラーがある間は切替をブロック（＝不完全なテキストを確定させない）。
  //  2) テキスト権威だった内容を Blockly に流し込み直し、編集の SSoT を Blockly へ戻す（順方向で store も整う）。
  function changeMainView(target: MainView) {
    if (mainView === "code" && target !== "code") {
      if (codeHasErrors) return;
      editor?.load(draft.program);
    }
    if (target === "code") {
      codeErrors = []; // 入場時は有効な種から始まるのでクリーンに戻す
      lastCodeText = $draftText; // ProgramEditor が種に取る値を再検証の種にも据える（素質変更時の再検証用）。
      codeViewing = false; // 入場は編集から（前回の観戦表示を持ち越さない）。
    }
    mainView = target;
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

<!-- 構築エリア全体：ヘッダー（タブ＋ゲージ）＋メイン領域を縦に積む。
     min-w-0: 横並びの flex 子として、中身(Blockly等)の最小幅で突っ張らず縮めるようにする
     （無いと固定幅の右レールを画面外へ押し出す）。 -->
<div class="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
  <!-- ヘッダー行＝自動機のマニフェスト。高さは右レールのヘッダーと揃える。
       左＝ビュー切替タブ（副作用なしのナビ＝セグメントタブ）／右＝イメージタイル＋資源配分（属性）＋デプロイ（起動）。
       右群は ml-auto で寄せ、イメージ（成果物）→配分（起動時パラメータ）→デプロイ（起動）の順に並べる。 -->
  <div class="flex h-9 shrink-0 items-center gap-3">
    <SegmentedTabs value={mainView} items={mainTabs} onChange={(v) => changeMainView(v as MainView)} />
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
          onclick={deploy}
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
           ビルドの入力なのでビルド動線（ビルドボタン）の近くに縦に並べる。両編集面で出す（素質は capability の基準で、
           ブロック編集はパレット、エディタ編集は capability 検証を切り替える＝どちらの編集にも効く入力）。
           面で非互換切替の意味が変わる（配置・配線は親の責務、破棄可否は子へ prop で渡す）:
            - ブロック編集：Blockly が SSoT。非互換はブロックを構造上保持できないので破棄（onClear で editor を空に）。
            - エディタ編集：テキストが権威。非互換命令は capability エラーで残せるので破棄しない（discardOnIncompatible=false）。
              切替後は現テキスト（lastCodeText）を新素質で再検証して表示エラーを更新する（onApplied）。 -->
      <div class="absolute right-5 top-15 z-20">
        <BaseImageSelector
          {allowedImages}
          onClear={() => editor?.load([])}
          discardOnIncompatible={mainView === "edit"}
          onApplied={mainView === "code" ? () => applyCodeText(lastCodeText) : undefined}
        />
      </div>
    {/if}

    <!-- ビルド＋同期操作：右上。ブロック/エディタ編集で出す（レジストリ＝保管の文脈では隠す）。
         ダーティー表示は専用ラベルを持たず、「前回ビルド時に戻す」が出ている事自体がダーティーの合図
         ＝戻すが無い（＝編集とビルド断面が一致）＝「ビルド済み（最新）」を✓で示す。 -->
    {#if mainView !== "registry"}
      <div class="absolute right-5 top-2 z-20 flex items-center gap-2">
        <!-- 編集を再開＝試運転の観戦オーバーレイを外して編集へ戻る（再生で自動的に観戦へ入るのに対し、戻るのは明示操作）。
             「前回ビルドに戻す」の左隣に置き、観戦中だけ出す。編集テキストはオーバーレイ下に保全されている。 -->
        {#if codeViewing}
          <button class="action-btn" onclick={() => (codeViewing = false)} title="試運転の表示を閉じて編集に戻る">
            <Icon icon="mdi:pencil" class="size-4" /> 編集を再開
          </button>
        {/if}
        <!-- 同期状態＆ロールバックはブロック/エディタ編集の両面で出す（戻し方は revertToBuilt が権威に応じて分岐）。
             ダーティー判定は program↔builtImage の純投影なので、テキスト権威の code モードでも applyCodeText 反映ぶんで効く。
             ただし code モードで構文エラー中は program が「直近の有効断面」で止まり dirty が false になり得る
             （壊れたテキストは BuildingArea から見えない）。戻し動線が一番要る瞬間なので codeHasErrors でも出す。 -->
        {#if current.dirty || (mainView === "code" && codeHasErrors && !current.notBuilt)}
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
        <!-- ビルドは両編集面で可。code モードは構文エラーがある間だけ押せない（確定をブロック）。 -->
        <button
          class="action-btn-strong disabled:opacity-40"
          onclick={build}
          disabled={codeHasErrors}
          title={codeHasErrors ? "構文エラーを直してからビルド" : "現在の編集をイメージ化"}
        >
          <Icon icon="mdi:wrench" class="size-4" /> ビルド
        </button>
      </div>
    {/if}

    {#if mainView === "code"}
      <!-- エディタ編集面（フル領域）：擬似コードをテキストで直接編集する。枠色は surface 系で揃える。
           見出しは親が描く帯なので持たず、本体を pt-12 下げて上端をブロック編集のキャンバス上端に揃える。
           入場時に現在の program を $draftText（読み投影）で種として渡し、以後はテキストが権威。
           入力は applyCodeText 経由で facade に委ね（parse 成功で program 反映）、
           構文エラーは codeErrors に受けてタブ切替・ビルドの確定をブロックする。 -->
      <div class="absolute inset-0 flex flex-col overflow-hidden rounded border border-surface-300 {panelClass}">
        <div class="flex min-h-0 flex-1 flex-col {HEADER_RESERVE_Y}">
          <!-- ロールバック時は codeSeedNonce を変えて remount し、戻した断面の $draftText を種に取り直させる。 -->
          {#key codeSeedNonce}
            <ProgramEditor initialText={$draftText} onInput={applyCodeText} errors={codeErrors} />
          {/key}
        </div>
      </div>

      <!-- 試運転の観戦オーバーレイ：再生中はビルド断面（builtLines）を実行行ハイライト付きで見せる（観戦面と同じ ProgramViewer）。
           下の ProgramEditor は unmount せず重ねるだけ＝未確定（構文エラー中含む）の編集テキストを保全する。
           「編集を再開」で外す。右上の操作群（z-20）はこの上に出るのでボタンに手が届く。 -->
      {#if codeViewing}
        <div class="absolute inset-0 z-10 flex flex-col overflow-hidden rounded border border-surface-300 {panelClass}">
          <div class="flex min-h-0 flex-1 flex-col {HEADER_RESERVE_Y}">
            <ProgramViewer lines={$builtLines} activeId={sandboxActiveId} fill showFollow />
          </div>
        </div>
      {/if}
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
