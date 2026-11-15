<script lang="ts">
  // ステージ対戦画面。
  // 固定ステージに ally プログラムを外部供給して対戦させ、決定的なフレーム列を再生する。
  // 状態の所有分担：
  // - 観戦セッション（出撃した ally ＋ ステージ）＝アプリ層 battle store
  // - 編集中ドラフト＝アプリ層 workbench store
  // - 再生位置（frameIndex/playing）＝本 route
  import Icon from "@iconify/svelte";
  import { battleFacade } from "#lib/presentation/composition";
  import {
    workbenchDraft,
    workbenchFacade,
    baseImageAllowed,
    highestAllowedImage,
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
    maxHpById,
    type AutomatonImage,
  } from "#lib/application";
  import type { PageData } from "./$types";
  import BattlePodViewer from "#lib/presentation/components/spectating/BattlePodViewer.svelte";
  import { resolveFrameCursor } from "#lib/presentation/utils/frameCursor";
  import PlaybackController from "#lib/presentation/components/spectating/PlaybackController.svelte";
  import SpectatorColumn from "#lib/presentation/components/spectating/SpectatorColumn.svelte";
  import ResultOverlay from "#lib/presentation/components/spectating/ResultOverlay.svelte";
  import ProgrammingDrawer from "#lib/presentation/components/building/ProgrammingDrawer.svelte";
  import MemoryPill from "#lib/presentation/components/shared/MemoryPill.svelte";
  import BaseImagePill from "#lib/presentation/components/shared/BaseImagePill.svelte";
  import { navigateTo } from "#lib/presentation/utils/navigation";
  import { attachPlaybackCues } from "#lib/presentation/sounds";
  import { emitFeedback } from "#lib/presentation/feedbacks";

  let { data }: { data: PageData } = $props();

  // ファサードは合成ルートから、ステージ id は URL（/battle-pod/[stage]）が SSoT。
  // load で検証済みの id を受け取り、URL を変えれば盤面・敵・CP 上限が差し替わる。
  const facade = battleFacade;
  const stageId = $derived(data.stageId);
  const stage = $derived(facade.getStage(stageId));

  // 次ステージ＝登録順の後続（並び順の正と後続の解決はアプリ層 facade に委ねる）。終端は null＝「次へ」を出さない。
  const nextStageId = $derived(facade.nextStageId(stageId));

  // デプロイ済みイメージ（出撃した実体・未デプロイは null）は battle store の所有 state を購読する。
  // program・表示名・素質・時刻は一体の集合体で、未デプロイは丸ごと null（表示メタだけ欠ける状態は起きない）。
  const deployed = $derived($battleSession.deployed);

  // BP 波形の天井＝このセッションで確定した bpMax（store が既定へステージ上書きを重ねた投影）。
  const bpMax = $derived($battleParams.bpMax);

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

  // 盤面・自他プログラムは観戦ビューに常時表示し、構築（構築エリア＋試運転）だけをドロワーに格納する。
  // `観る → 直す → また観る` の文脈を切らさないため（docs/design/ui-screen-design.md）。
  let drawerOpen = $state(false);

  // 観戦フレーム（battle 投影 $battleRun）× 再生位置（route の frameIndex）／ステージ（route の stage）の
  // クロス join はプレゼンで解決する（4層の依存を単一スライスに閉じる）。
  // displayFrames＝デプロイ前は route が持つ stage.initial の1フレーム、デプロイ後は実行フレーム列。
  const frames = $derived($battleRun?.frames ?? []);
  const result = $derived($battleRun?.result ?? null);
  // 実戦カーソル＝実行フレーム列（winner/active 用）。デプロイ前は空。
  const liveCursor = $derived(resolveFrameCursor(frames, frameIndex));
  const current = $derived(liveCursor.current);
  const lastIndex = $derived(liveCursor.lastIndex);
  // 表示カーソル＝盤面用。デプロイ前は stage.initial の1フレームにフォールバックして常に描ける。
  const displayFrames = $derived(frames.length > 0 ? frames : [stage.initial]);
  const displayCursor = $derived(resolveFrameCursor(displayFrames, frameIndex));
  const displayFrame = $derived(displayCursor.current ?? stage.initial);
  const prevFrame = $derived(displayCursor.prev);

  // 決着の表示は「観戦が決着フレームに到達したとき」に出す（結果を先にネタバレしない）。
  const decided = $derived(current?.winner != null);

  // 構築ドロワーを開く＝直す。編集中は再生を止める（表示する面は構築エリアに委ねる）。
  function openDrawer() {
    drawerOpen = true;
    playing = false;
  }

  // デプロイ＝ビルド済みイメージを対戦に出す（battle store が ally を差し替える）。別のイメージを出したら
  // 必ず先頭・実行前へ＝「deploy で再生リセット」を再生状態の所有者（プレゼン）が担う。
  // 名前は構築エリアのカレントイメージ名を受け取り、観戦側タイルで同じ表示名を出す。
  // allyHp＝構築エリアで配分した初期 HP（HP 側＝総メモリ − CP 割り当て）。所有は構築側なので onDeploy で受け取る。
  function deployImage(image: AutomatonImage, name: string, allyHp: number) {
    facade.deploy(image, name, allyHp);
    frameIndex = 0;
    playing = false;
    started = false;
    drawerOpen = false;
  }

  // 実行＝対戦の再生を開始する（開始前の大きな一押し）。先頭から再生し、以後は再生コントロールに差し替わる。
  // anchor＝押された実行ボタン。吹き出しをその近傍へ出す（再生開始で消えるので発火の瞬間に矩形を確定）。
  function startPlayback(anchor?: HTMLElement) {
    frameIndex = 0;
    started = true;
    playing = true;
    emitFeedback("run", { anchor });
  }

  // 結果オーバーレイの「もう一度」：先頭へ戻して停止状態にする（再生はユーザーが押す。編集は「組む」に委ねる）。
  function replay() {
    frameIndex = 0;
    playing = false;
  }

  // 観戦セッションを「今のステージ」で開く＝プレゼンが URL から解決した stage を openSession で渡す。
  // openSession はデプロイを破棄（別ステージの対戦は成立しない）、再生状態はプレゼンの所有なのでここで初期へ。
  // effect はマウント時＋ステージ切替時に走る（クライアントナビは再マウントしないため切替を effect で受ける）。
  // CSR では effect が描画前にフラッシュされるため、敵表示（battle 投影）も初回から埋まる。
  $effect(() => {
    facade.openSession(stage);
    frameIndex = 0;
    playing = false;
    started = false;
  });

  // ステージの素質制限に合わせて編集中ドラフトの素質をクランプする。許可外のときだけ許可最上位版へ寄せる
  // （プログラムは保持し、非互換命令は編集面の capability エラーで示す）。素質選択UIの絞り込みと対で制限を実効化する。
  $effect(() => {
    const allowed = stage.allowedImages;
    if (!allowed || baseImageAllowed($workbenchDraft.baseImage, allowed)) return;
    const target = highestAllowedImage(allowed);
    if (target) workbenchFacade.setBaseImage(target);
  });

  // 再生位置の前進に合わせて効果音を鳴らす（本番・試運転で共有の配線）。
  attachPlaybackCues(
    () => frames,
    () => frameIndex,
    () => playing,
  );
</script>

<!-- 一画面（iPad 横向き前提・スクロール無し）：ヘッダーの残り高を埋め、はみ出しは内側で吸収。 -->
<div class="mx-auto flex h-full max-w-6xl flex-col gap-3 overflow-hidden p-3">
  <!-- ステージ文脈：枠なしの細い帯（名前＋ゴール＋持ち分ブリーフ）。選択はヘッダーの「ステージ選択」に委ねる。 -->
  <div class="shrink-0 text-center text-sm">
    <p><span class="font-bold">{stage.label}</span> — {stage.goal}</p>
    <!-- 入場後も制約（メモリ・使える版）を常時出す。配分操作自体は構築ドロワーに委ねる。
         allowedImages 未指定＝無制限はデフォルト状態なので版ピルを出さない（メモリのみ）。 -->
    <div class="mt-0.5 flex flex-wrap items-center justify-center gap-1.5">
      <MemoryPill memoryTotal={stage.memoryTotal} memoryGrain={stage.memoryGrain} />
      {#each stage.allowedImages ?? [] as img (img.imageName + img.version)}
        <BaseImagePill base={img} />
      {/each}
    </div>
  </div>

  <!-- 観戦ビュー（常時表示）。横向き一画面を 1:2:1 の3カラムに割る。
       左=Ally／右=Enemy は各陣営の「ステータス＋プログラム」を縦に積む（コードは縦伸びなので縦カラムが噛み合う）。
       中央=盤面を主役に据える（正方形・迷路化を見越し、横長帯を前提にしない）。
       frameIndex=0 の間は初期配置、再生すると対戦経過が同じ盤面に流れる。 -->
  <section class="flex min-h-0 flex-1 gap-4">
    <!-- 左カラム（幅比1）：Ally。観戦が映すのはデプロイ済みイメージ＝「出撃した実体」。
         未デプロイなら inactive＋空プログラム。正体は未デプロイ時に空表示＋ドリフトで「要再デプロイ」。 -->
    <SpectatorColumn
      frames={displayFrames}
      {frameIndex}
      id="ally"
      maxHp={$maxHpById.ally}
      {bpMax}
      inactive={deployed === null}
      lines={$allyLines}
      activeId={current?.active?.ally}
      log={$allyLog}
      hash={$deployedHash}
      name={deployed?.name ?? ""}
      baseImage={deployed?.baseImage}
      timeLabel={deployedAtLabel}
      drift={deployDrift}
      emptyLabel="未デプロイ"
    />

    <!-- 中央カラム（幅比2）：盤面（主役）＋再生コントロール。未デプロイでも初期盤面は出し、
         再生コントローラだけをデプロイ促しに差し替える（盤面・敵は隠さない）。 -->
    <div class="flex min-h-0 flex-[2] flex-col items-center gap-2">
      <!-- 盤面エリア（残り高を埋める。決着時は結果オーバーレイを重ねる） -->
      <div class="relative min-h-0 w-full flex-1">
        <!-- 非活性はデプロイ前のみ（まだ自機が出ていない）。デプロイ後は実行前でも活性で描く。 -->
        <BattlePodViewer state={displayFrame} allyInactive={deployed === null} prev={prevFrame} />
        {#if decided && result}
          <!-- 「次へ」は勝利時かつ次ステージがあるときだけ（onNext を渡す＝条件成立）。遷移先 id はプレゼンが解決。 -->
          <ResultOverlay
            winner={result.winner}
            onReplay={replay}
            onNext={nextStageId ? () => navigateTo(`/battle-pod/${nextStageId}`) : undefined}
          />
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
        <button class="action-btn-strong px-6" onclick={(e) => startPlayback(e.currentTarget)}>
          <Icon icon="mdi:play" class="size-4" /> 実行
        </button>
      {/if}
    </div>

    <!-- 右カラム（幅比1）：Enemy。Ally と同じ陣営カラムで左右対称に。正体はステージ固定（時刻・ドリフト無し）。 -->
    <SpectatorColumn
      frames={displayFrames}
      {frameIndex}
      id="enemy"
      maxHp={$maxHpById.enemy}
      {bpMax}
      lines={$enemyLines}
      activeId={current?.active?.enemy}
      log={$enemyLog}
      hash={$enemyHash}
      name={stage.enemyLabel}
      baseImage={stage.enemyBaseImage}
    />
  </section>

  <!-- 下バー：構築ドロワーのトリガー。ドロワーと同じ「下から」に置き、出現場所と一致させる。 -->
  <button class="action-btn-strong shrink-0 rounded-lg px-6 py-3 text-base font-bold" onclick={openDrawer}>
    <Icon icon="mdi:hammer-wrench" class="size-5" /> プログラミング
  </button>
</div>

<!-- 構築ボトムドロワー＝作業台。開閉はトリガーを持つ本 route が所有し、ドロワーへ open/onClose で渡す。
     ステージ由来の構築制約・参照盤面・敵プログラムは props で供給（コンポーネントはストア非購読）。 -->
<ProgrammingDrawer
  open={drawerOpen}
  onClose={() => (drawerOpen = false)}
  memoryTotal={stage.memoryTotal}
  memoryGrain={stage.memoryGrain}
  allowedImages={stage.allowedImages}
  stageInitial={stage.initial}
  enemyLines={$enemyLines}
  sandboxImage={$workbenchDraft.builtImage?.program ?? null}
  {facade}
  onDeploy={deployImage}
/>
