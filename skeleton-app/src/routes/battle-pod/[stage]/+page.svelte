<script lang="ts">
  // 観戦（スペクテイター）PoC。
  // 固定ステージに対し、プレイヤーの ally プログラムを「外部供給」して対戦させ、
  // 決定的なフレーム列を再生する。ally は F1 からブロックUI（Blockly）で組む。
  // 対戦実行はアプリ層ファサード runStage() 経由。設計は docs/design/execution-model.md を参照。
  // 構築エリア（左）・試運転レール（右）はレジストリ管理ページと共有する部品に切り出した。
  import Icon from "@iconify/svelte";
  import { battleFacade } from "$lib/presentation/composition";
  import type { PageData } from "./$types";
  import type { Program } from "$lib/domain";
  import { ALLY_PRESETS } from "$lib/presentation/constants/allyPresets";
  import BuildingArea from "$lib/presentation/components/building/BuildingArea.svelte";
  import BattlePodViewer from "$lib/presentation/components/spectating/BattlePodViewer.svelte";
  import PlaybackController from "$lib/presentation/components/spectating/PlaybackController.svelte";
  import AutomatonStatusViewer from "$lib/presentation/components/spectating/AutomatonStatusViewer.svelte";
  import ResultOverlay from "$lib/presentation/components/spectating/ResultOverlay.svelte";
  import SandboxRail from "$lib/presentation/components/spectating/SandboxRail.svelte";
  import ProgramViewer from "$lib/presentation/components/inspecting/ProgramViewer.svelte";
  import ActionLogViewer from "$lib/presentation/components/inspecting/ActionLogViewer.svelte";
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

  // ally の Program はブロックUI から供給される（継ぎ目は runStage の引数＝Program で確定済み）。
  // 構築エリア内の Blockly を編集の SSoT とし、allyProgram はそこから流れてくる読み取り専用の断面。
  let allyProgram = $state<Program>([]);

  const run = $derived(facade.runStage(stageId, allyProgram));
  const frames = $derived(run.frames);
  const result = $derived(run.result);

  let frameIndex = $state(0);
  let playing = $state(false);

  // 盤面・自他プログラムは観戦ビューに常時表示し、構築（構築エリア＋試運転）だけをドロワーに畳む。
  // `観る → 直す → また観る` の文脈を切らさないため（docs/design/ui-screen-design.md）。
  let drawerOpen = $state(false);

  // 構築ドロワー右レールの切替：参照（ステージの初期配置＋敵の手の内）⇄ 試運転（相手なし／stub の固定盤サンドボックス）。
  // 試運転は SandboxRail に切り出し済み（レジストリ管理ページと共有）。参照はステージ固有なので inline に残す。
  let railView = $state<"reference" | "sandbox">("reference");

  // 観戦ビュー下段の表示切替：プログラム（擬似コード）⇄ ログ（行動履歴）。自/敵で独立して切り替える。
  // トグルはビューワー右上にオーバーレイし、プログラム表示時は ProgramViewer 内蔵の追従トグルの左隣に並ぶ。
  let allyView = $state<"program" | "log">("program");
  let enemyView = $state<"program" | "log">("program");

  const current = $derived(frames[Math.min(frameIndex, frames.length - 1)]);
  const lastIndex = $derived(frames.length - 1);

  // 構築ドロワーの参照レールに出す初期盤面（実行前の配置）。地形と初期位置を見て作戦を組むため。
  const initialFrame = $derived(frames[0]);

  // 決着の表示は「観戦が決着フレームに到達したとき」に出す（結果を先にネタバレしない）。
  const decided = $derived(current.winner !== null);

  // 構築ドロワーを開く＝直す。編集中は再生を止める（表示する面は構築エリアに委ねる）。
  function openDrawer() {
    drawerOpen = true;
    playing = false;
  }

  // 結果オーバーレイの「もう一度」：先頭へ戻して停止状態にする（再生はユーザーが押す。編集は「組む」に委ねる）。
  function replay() {
    frameIndex = 0;
    playing = false;
  }

  // ally プログラム／ステージが変わったら先頭に戻す（直前の観戦を持ち越さない）。
  $effect(() => {
    void allyProgram;
    void stageId;
    frameIndex = 0;
    playing = false;
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
    <!-- 下段ビュー切替（プログラム ⇄ ログ）。ビューワー右上にオーバーレイし、列ごとに独立。
         プログラム表示時は ProgramViewer 内蔵の追従トグルの左隣に並ぶ。暗地のオーバーレイ＝アイコンのみ。 -->
    {#snippet viewToggle(view: "program" | "log", setView: (v: "program" | "log") => void)}
      <button
        class="inline-flex items-center justify-center rounded border p-1 {view === 'program'
          ? 'border-surface-50 bg-surface-50 text-surface-950'
          : 'border-surface-600 bg-surface-900/70 text-surface-300 hover:bg-surface-800'}"
        aria-pressed={view === "program"}
        aria-label="プログラム表示"
        title="プログラム"
        onclick={() => setView("program")}
      >
        <Icon icon="mdi:code-braces" class="size-4" />
      </button>
      <button
        class="inline-flex items-center justify-center rounded border p-1 {view === 'log'
          ? 'border-surface-50 bg-surface-50 text-surface-950'
          : 'border-surface-600 bg-surface-900/70 text-surface-300 hover:bg-surface-800'}"
        aria-pressed={view === "log"}
        aria-label="ログ表示"
        title="ログ"
        onclick={() => setView("log")}
      >
        <Icon icon="mdi:table" class="size-4" />
      </button>
    {/snippet}
    <!-- 列ごとの切替を、ビューワーの actions（右上オーバーレイ）に流し込む無引数スニペット。 -->
    {#snippet allyActions()}{@render viewToggle(allyView, (v) => (allyView = v))}{/snippet}
    {#snippet enemyActions()}{@render viewToggle(enemyView, (v) => (enemyView = v))}{/snippet}

    <!-- 左カラム（幅比1）：Ally のステータス（上）＋プログラム/ログ（下・フル高。切替はビューワー右上）。
         実行中は current の active でハイライト。識別は小アイコンのみ（名前はステータス側）。 -->
    <div class="flex min-h-0 flex-1 flex-col gap-2">
      <AutomatonStatusViewer {frames} {frameIndex} id="ally" maxHp={maxHpById.ally} />
      {#if allyView === "program"}
        <ProgramViewer program={allyProgram} activeId={current.active?.ally} fill showFollow actions={allyActions} />
      {:else}
        <ActionLogViewer {frames} {frameIndex} program={allyProgram} id="ally" fill actions={allyActions} />
      {/if}
    </div>

    <!-- 中央カラム（幅比2）：盤面（主役）＋再生コントロール。
         盤面は残り領域いっぱいの箱に入れ、その中でコンテナfitさせる（8×8・迷路化でもはみ出さない）。 -->
    <div class="flex min-h-0 flex-[2] flex-col items-center gap-2">
      <!-- 盤面エリア（残り高を埋める。決着時は結果オーバーレイを重ねる） -->
      <div class="relative min-h-0 w-full flex-1">
        <BattlePodViewer state={current} />
        {#if decided}
          <ResultOverlay winner={result.winner} onReplay={replay} />
        {/if}
      </div>
      <PlaybackController bind:frameIndex bind:playing {lastIndex} clock={current.clock} />
    </div>

    <!-- 右カラム（幅比1）：Enemy のステータス（上）＋プログラム/ログ（下・フル高。切替はビューワー右上）。 -->
    <div class="flex min-h-0 flex-1 flex-col gap-2">
      <AutomatonStatusViewer {frames} {frameIndex} id="enemy" maxHp={maxHpById.enemy} />
      {#if enemyView === "program"}
        <ProgramViewer program={stage.enemy} activeId={current.active?.enemy} fill showFollow actions={enemyActions} />
      {:else}
        <ActionLogViewer {frames} {frameIndex} program={stage.enemy} id="enemy" fill actions={enemyActions} />
      {/if}
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
  <!-- 2カラム：左＝構築エリア（flex-1）／右＝参照レール（固定幅）。両列のヘッダー高（h-9）を揃える。 -->
  <div class="flex min-h-0 flex-1 gap-4">
    <!-- 構築エリア：タブ（ブロック編集/エディタ編集/レジストリ）＋CPゲージ＋Blockly 等を内包。
         ドロワーは transform で開くため active にドロワー開閉を渡して開いた後に resize させる。 -->
    <BuildingArea
      bind:program={allyProgram}
      cpLimit={stage.capacity}
      presets={ALLY_PRESETS}
      active={drawerOpen}
      showDeploy
    />

    <!-- 参照レール列：ヘッダー（参照⇄試運転タブ＋閉じる）＋本体（参照は inline／試運転は SandboxRail）。 -->
    <div class="flex min-h-0 w-[26rem] shrink-0 flex-col gap-3">
      <!-- ヘッダー行（固定高 h-9＝構築エリアのヘッダーと高さを揃える）。 -->
      <div class="flex h-9 shrink-0 items-center justify-between gap-3">
        <div class="flex items-center gap-1">
          {#snippet railTab(value: "reference" | "sandbox", icon: string, label: string)}
            <button class={railView === value ? "action-btn-strong" : "action-btn"} onclick={() => (railView = value)}>
              <Icon {icon} class="size-4" />
              {label}
            </button>
          {/snippet}
          {@render railTab("reference", "mdi:map-marker-outline", "ステージ情報")}
          {@render railTab("sandbox", "mdi:flask-outline", "試運転")}
        </div>
        <button class="action-btn" onclick={() => (drawerOpen = false)}>
          閉じる <Icon icon="mdi:close" class="size-4" />
        </button>
      </div>

      <!-- 本体：参照（ステージの初期配置＋敵の手の内）／試運転（SandboxRail）を同じ枠線で囲う。 -->
      <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-auto rounded border border-surface-300 bg-surface-50 p-3">
        {#if railView === "reference"}
          <!-- ヘッダー（固定高 h-7・左寄せ）：サンドボックスの見出し行と高さ・位置を揃え、下の盤面を一致させる。 -->
          <div class="flex h-7 shrink-0 items-center gap-1 text-xs font-bold opacity-70">
            <Icon icon="mdi:view-grid-outline" class="size-4" /> 初期配置
          </div>
          <!-- 盤面：試運転と同じラッパー（同じ形なら位置が一致する）。 -->
          <div class="flex shrink-0 justify-center">
            <BattlePodViewer state={initialFrame} size="sm" />
          </div>

          <ProgramViewer
            title="Enemy"
            titleIcon={automatonIcon("enemy")}
            program={stage.enemy}
            activeId={undefined}
            fill
          />
        {:else}
          <SandboxRail program={allyProgram} {facade} />
        {/if}
      </div>
    </div>
  </div>
</aside>
