<script lang="ts">
  // 観戦（スペクテイター）PoC。
  // 固定ステージに対し、プレイヤーの ally プログラムを「外部供給」して対戦させ、
  // 決定的なフレーム列を再生する。ally は F1 からブロックUI（Blockly）で組む。
  // 観戦セッション（出撃した ally＝deployedImage ＋ 舞台）はアプリ層 battle store が所有する。
  // route は URL から stage を解決して openSession で渡し、deploy は facade コマンド、
  // run/行/ログ/hash は store の読み投影を購読する。
  // 再生位置（frameIndex/playing）は観戦 UI の状態なので route が持つ。
  // 構築エリア（左）・試運転レール（右）はレジストリ管理ページと共有する部品に切り出した。
  // ally の編集中ドラフト（program／builtImage）はアプリ層のワークベンチ store が持つ。
  import Icon from "@iconify/svelte";
  import { battleFacade } from "$lib/presentation/composition";
  import {
    workbenchDraft,
    differsFromBuilt,
    battleSession,
    battleRun,
    allyLines,
    enemyLines,
    allyLog,
    enemyLog,
    deployedHash,
    enemyHash,
    battleParams,
    type Program,
    type BaseImage,
  } from "$lib/application";
  import type { PageData } from "./$types";
  import BuildingArea from "$lib/presentation/components/building/BuildingArea.svelte";
  import BattlePodViewer from "$lib/presentation/components/spectating/BattlePodViewer.svelte";
  import PlaybackController from "$lib/presentation/components/spectating/PlaybackController.svelte";
  import AutomatonStatusViewer from "$lib/presentation/components/spectating/AutomatonStatusViewer.svelte";
  import ResultOverlay from "$lib/presentation/components/spectating/ResultOverlay.svelte";
  import SandboxRail from "$lib/presentation/components/spectating/SandboxRail.svelte";
  import SegmentedTabs from "$lib/presentation/components/shared/SegmentedTabs.svelte";
  import ProgramViewer from "$lib/presentation/components/inspecting/ProgramViewer.svelte";
  import ActionLogViewer from "$lib/presentation/components/inspecting/ActionLogViewer.svelte";
  import ImageViewer from "$lib/presentation/components/inspecting/ImageViewer.svelte";
  import { automatonIcon } from "$lib/presentation/utils/labels";
  import { fade } from "svelte/transition";

  let { data }: { data: PageData } = $props();

  // ファサードは合成ルートから、ステージ id は URL（/battle-pod/[stage]）が SSoT。
  // load で検証済みの id を受け取り、URL を変えれば盤面・敵・CP 上限が差し替わる。
  const facade = battleFacade;
  const stageId = $derived(data.stageId);
  const stage = $derived(facade.getStage(stageId));

  // HP バーの満タン基準＝初期 HP。選択ステージの初期配置から id → 初期 HP を引く。
  const maxHpById = $derived<Record<string, number>>(
    Object.fromEntries(stage.initial.automatons.map((a) => [a.id, a.hp])),
  );

  // BP 波形の天井＝このセッションで確定した bpMax（store が既定へステージ上書きを重ねた投影）。
  const bpMax = $derived($battleParams.bpMax);

  // デプロイ済みイメージ（出撃した実体・未デプロイは null）は battle store の所有 state を購読する。
  // program・表示名・素質・時刻は一体の集合体で、未デプロイは丸ごと null（表示メタだけ欠ける状態は起きない）。
  const deployed = $derived($battleSession.deployed);

  // デプロイ時刻ラベル（表示整形はプレゼン）。
  const deployedAtLabel = $derived(
    deployed === null
      ? null
      : new Date(deployed.deployedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
  );
  // デプロイ済みと編集側の最新ビルドがズレているか＝「要再デプロイ」（dirty と対称）。
  // workbench × battle のクロススライス join なのでプレゼンで解決する（内容等価はアプリ層セレクタに閉じる）。
  const deployDrift = $derived(differsFromBuilt($workbenchDraft, deployed?.program ?? null));

  // 再生状態（観戦 UI の所有）。frameIndex/playing/started は route が持つ（battle には置かない）。
  let frameIndex = $state(0);
  let playing = $state(false);
  // デプロイ後に一度でも実行したか。
  let started = $state(false);

  // 盤面・自他プログラムは観戦ビューに常時表示し、構築（構築エリア＋試運転）だけをドロワーに畳む。
  // `観る → 直す → また観る` の文脈を切らさないため（docs/design/ui-screen-design.md）。
  let drawerOpen = $state(false);

  // 構築ドロワー右レールの切替：参照（ステージの初期配置＋敵の手の内）⇄ 試運転（相手なし／stub の固定盤サンドボックス）。
  // 試運転は SandboxRail に切り出し済み（レジストリ管理ページと共有）。参照はステージ固有なので inline に残す。
  type RailView = "reference" | "sandbox";
  let railView = $state<RailView>("reference");
  const railTabs = [
    { value: "reference", icon: "mdi:map-marker-outline", label: "ステージ情報" },
    { value: "sandbox", icon: "mdi:flask-outline", label: "試運転" },
  ];

  // 観戦ビュー下段の表示切替：プログラム（擬似コード）／ログ（行動履歴）／イメージ（正体＝ハッシュ-名前-時刻）。
  // 自/敵で独立して切り替える。トグルはビューワー右上にオーバーレイする。
  // イメージは両列に出して左右対称を保つ（Ally=デプロイ済み＋ドリフト、Enemy=ステージ固定）。
  type ColumnView = "program" | "log" | "image";
  let allyView = $state<ColumnView>("program");
  let enemyView = $state<ColumnView>("program");
  // 列ごとのビュー切替タブ（イメージ＝正体 → プログラム → ログ）。ビューワーの見出しに置く。
  const columnTabs = [
    { value: "image", icon: "mdi:cube-outline", label: "イメージ" },
    { value: "program", icon: "mdi:code-braces", label: "プログラム" },
    { value: "log", icon: "mdi:table", label: "ログ" },
  ];

  // 観戦フレーム（battle 投影 $battleRun）× 再生位置（route の frameIndex）／舞台（route の stage）の
  // クロス join はプレゼンで解決する（4層の依存を単一スライスに閉じる）。
  // displayFrames＝デプロイ前は route が持つ stage.initial の1フレーム、デプロイ後は実行フレーム列。
  const frames = $derived($battleRun?.frames ?? []);
  const result = $derived($battleRun?.result ?? null);
  const current = $derived(frames.length > 0 ? frames[Math.min(frameIndex, frames.length - 1)] : null);
  const lastIndex = $derived(Math.max(0, frames.length - 1));
  const displayFrames = $derived(frames.length > 0 ? frames : [stage.initial]);
  const displayFrame = $derived(displayFrames[Math.min(frameIndex, displayFrames.length - 1)]);

  // 決着の表示は「観戦が決着フレームに到達したとき」に出す（結果を先にネタバレしない）。
  const decided = $derived(current?.winner != null);

  // 構築ドロワーを開く＝直す。編集中は再生を止める（表示する面は構築エリアに委ねる）。
  function openDrawer() {
    drawerOpen = true;
    playing = false;
  }

  // デプロイ＝ビルド済みイメージを対戦に出す（battle store が ally を差し替える）。別のイメージを出したら
  // 必ず先頭・実行前へ＝「deploy で再生リセット」を再生状態の所有者（プレゼン）が畳む。
  // 名前は構築エリアのカレントイメージ名を受け取り、観戦側タイルで同じ表示名を出す。
  function deployImage(image: Program, name: string, baseImage: BaseImage) {
    facade.deploy(image, name, baseImage);
    frameIndex = 0;
    playing = false;
    started = false;
    drawerOpen = false;
  }

  // 実行＝対戦の再生を開始する（開始前の大きな一押し）。先頭から再生し、以後は再生コントロールに差し替わる。
  function startPlayback() {
    frameIndex = 0;
    started = true;
    playing = true;
  }

  // 結果オーバーレイの「もう一度」：先頭へ戻して停止状態にする（再生はユーザーが押す。編集は「組む」に委ねる）。
  function replay() {
    frameIndex = 0;
    playing = false;
  }

  // 観戦セッションを「今の舞台」で開く＝プレゼンが URL から解決した stage を openSession で渡す。
  // openSession はデプロイを破棄（別ステージの対戦は成立しない）、再生状態はプレゼンの所有なのでここで初期へ。
  // effect はマウント時＋ステージ切替時に走る（クライアントナビは再マウントしないため切替を effect で受ける）。
  // CSR では effect が描画前にフラッシュされるため、敵表示（battle 投影）も初回から埋まる。
  $effect(() => {
    facade.openSession(stage);
    frameIndex = 0;
    playing = false;
    started = false;
  });
</script>

<!-- 一画面（iPad 横向き前提・スクロール無し）：ヘッダーの残り高を埋め、はみ出しは内側で吸収。 -->
<div class="mx-auto flex h-full max-w-6xl flex-col gap-3 overflow-hidden p-3">
  <!-- ステージ文脈：枠なしの細い1行（名前＋ゴール）。選択はヘッダーの「ステージ選択」に委ねる。 -->
  <p class="shrink-0 text-center text-sm"><span class="font-bold">{stage.label}</span> — {stage.goal}</p>

  <!-- 観戦ビュー（常時表示）。横向き一画面を 1:2:1 の3カラムに割る。
       左=Ally／右=Enemy は各陣営の「ステータス＋プログラム」を縦に積む（コードは縦伸びなので縦カラムが噛み合う）。
       中央=盤面を主役に据える（正方形・迷路化を見越し、横長帯を前提にしない）。
       frameIndex=0 の間は初期配置、再生すると対戦経過が同じ盤面に流れる。 -->
  <section class="flex min-h-0 flex-1 gap-4">
    <!-- 左カラム（幅比1）：Ally。ステータス／ビュー切替タブ／本体を1枚の黒パネルに統合する。
         観戦が映すのはデプロイ済みイメージ＝「出撃した実体」。未デプロイなら ally プログラムは空。 -->
    <div
      class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-900 text-gray-200"
    >
      <AutomatonStatusViewer frames={displayFrames} {frameIndex} id="ally" maxHp={maxHpById.ally} {bpMax} />
      <!-- ビュー切替タブ（ダーク）＝パネル内の区切り兼見出し。イメージ/プログラム/ログ。 -->
      <div class="flex shrink-0 justify-center border-t border-gray-800 p-2">
        <SegmentedTabs value={allyView} items={columnTabs} onChange={(v) => (allyView = v as ColumnView)} dense dark />
      </div>
      <!-- ビュー本体（パネル下段・フル高。各ビューワーの黒地が親パネルと一体に見える）。 -->
      <div class="flex min-h-0 flex-1 flex-col p-3 pt-0">
        {#if allyView === "program"}
          <ProgramViewer lines={$allyLines} activeId={current?.active?.ally} fill showFollow />
        {:else if allyView === "log"}
          <ActionLogViewer log={$allyLog} {frameIndex} fill compact />
        {:else}
          <!-- イメージ＝デプロイ済みの正体。未デプロイは空表示、編集側の最新ビルドとズレたら「要再デプロイ」。 -->
          <ImageViewer
            hash={$deployedHash}
            name={deployed?.name ?? ""}
            baseImage={deployed?.baseImage}
            timeLabel={deployedAtLabel}
            drift={deployDrift}
            emptyLabel="未デプロイ"
            fill
          />
        {/if}
      </div>
    </div>

    <!-- 中央カラム（幅比2）：盤面（主役）＋再生コントロール。未デプロイでも初期盤面は出し、
         再生コントローラだけをデプロイ促しに差し替える（盤面・敵は隠さない）。 -->
    <div class="flex min-h-0 flex-[2] flex-col items-center gap-2">
      <!-- 盤面エリア（残り高を埋める。決着時は結果オーバーレイを重ねる） -->
      <div class="relative min-h-0 w-full flex-1">
        <!-- 非活性はデプロイ前のみ（まだ自機が出ていない）。デプロイ後は実行前でも活性で描く。 -->
        <BattlePodViewer state={displayFrame} allyInactive={deployed === null} />
        {#if decided && result}
          <ResultOverlay winner={result.winner} onReplay={replay} />
        {/if}
      </div>
      {#if !deployed}
        <!-- 未デプロイ：再生する対戦がまだ無いので、コントローラの位置にデプロイ促しを置く。 -->
        <div class="flex h-9 items-center justify-center gap-1.5 text-xs text-surface-500">
          <Icon icon="mdi:rocket-launch-outline" class="size-4" /> オートマトンをデプロイして対戦
        </div>
      {:else if started}
        <PlaybackController bind:frameIndex bind:playing {lastIndex} clock={displayFrame.clock} />
      {:else}
        <!-- デプロイ済み・開始前：再生コントロールの代わりに「実行」の一押しを出す。 -->
        <button class="action-btn-strong px-6" onclick={startPlayback}>
          <Icon icon="mdi:play" class="size-4" /> 実行
        </button>
      {/if}
    </div>

    <!-- 右カラム（幅比1）：Enemy。Ally と同じ黒パネル構成（ステータス／タブ／本体）で左右対称に。 -->
    <div
      class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-900 text-gray-200"
    >
      <AutomatonStatusViewer frames={displayFrames} {frameIndex} id="enemy" maxHp={maxHpById.enemy} {bpMax} />
      <div class="flex shrink-0 justify-center border-t border-gray-800 p-2">
        <SegmentedTabs
          value={enemyView}
          items={columnTabs}
          onChange={(v) => (enemyView = v as ColumnView)}
          dense
          dark
        />
      </div>
      <div class="flex min-h-0 flex-1 flex-col p-3 pt-0">
        {#if enemyView === "program"}
          <ProgramViewer lines={$enemyLines} activeId={current?.active?.enemy} fill showFollow />
        {:else if enemyView === "log"}
          <ActionLogViewer log={$enemyLog} {frameIndex} fill compact />
        {:else}
          <!-- イメージ＝ステージ固定の敵の正体（Ally と同体裁で左右対称に）。時刻・ドリフトは持たない。 -->
          <ImageViewer hash={$enemyHash} name={stage.enemyLabel} baseImage={stage.enemyBaseImage} fill />
        {/if}
      </div>
    </div>
  </section>

  <!-- 下バー：構築ドロワーのトリガー。ドロワーと同じ「下から」に置き、出現場所と一致させる。 -->
  <button class="action-btn-strong shrink-0 rounded-lg px-6 py-3 text-base font-bold" onclick={openDrawer}>
    <Icon icon="mdi:hammer-wrench" class="size-5" /> プログラミング
  </button>
</div>

<!-- 構築ボトムドロワー＝作業台：構築エリア（左・大）＋参照レール（右・初期盤面/敵コード or 試運転）。
     全幅を取れる下から出す形で Blockly に広さを与える。常時マウントして translate で開閉し、
     開閉でワークスペース（組みかけのブロック）が消えないようにする。 -->
{#if drawerOpen}
  <button
    class="fixed inset-0 z-40 bg-black/40"
    aria-label="構築を閉じる"
    onclick={() => (drawerOpen = false)}
    transition:fade={{ duration: 200 }}
  ></button>
{/if}
<aside
  class="fixed inset-x-0 bottom-0 z-50 flex h-[92dvh] flex-col rounded-t-xl bg-surface-50 p-4 shadow-xl transition-transform duration-300 {drawerOpen
    ? 'translate-y-0'
    : 'translate-y-full'}"
>
  <!-- 2カラム：左＝構築エリア／右＝参照レール（固定幅）。両列のヘッダー高を揃える。 -->
  <div class="flex min-h-0 flex-1 gap-4">
    <!-- 構築エリア：タブ（ブロック編集/エディタ編集/レジストリ）＋CPゲージ＋Blockly 等を内包。
         ドロワーは transform で開くため active にドロワー開閉を渡して開いた後に resize させる。 -->
    <BuildingArea
      memoryTotal={stage.capacity}
      active={drawerOpen}
      showDeploy
      onDeploy={deployImage}
      panelClass="bg-white"
    />

    <!-- 参照レール列：ヘッダー（参照⇄試運転タブ＋閉じる）＋本体（参照は inline／試運転は SandboxRail）。 -->
    <div class="flex min-h-0 w-[26rem] shrink-0 flex-col gap-3">
      <!-- ヘッダー行：高さは構築エリアのヘッダーと揃える。 -->
      <div class="flex h-9 shrink-0 items-center justify-between gap-3">
        <SegmentedTabs value={railView} items={railTabs} onChange={(v) => (railView = v as RailView)} />
        <button class="action-btn" onclick={() => (drawerOpen = false)}>
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
          <!-- 盤面：試運転と同じラッパー（同じ形なら位置が一致する）。デプロイ前でも見られるよう
               実行結果ではなくステージ定義の初期状態（stage.initial）を直接描く。 -->
          <div class="flex shrink-0 justify-center">
            <BattlePodViewer state={stage.initial} size="sm" />
          </div>

          <ProgramViewer
            title="敵プログラム"
            titleIcon={automatonIcon("enemy")}
            lines={$enemyLines}
            activeId={undefined}
            fill
          />
        {:else}
          <SandboxRail image={$workbenchDraft.builtImage} {facade} />
        {/if}
      </div>
    </div>
  </div>
</aside>
