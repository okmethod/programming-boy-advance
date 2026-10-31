<script lang="ts">
  // 観戦（スペクテイター）PoC。
  // 固定ステージに対し、プレイヤーの ally プログラムを「外部供給」して対戦させ、
  // 決定的なフレーム列を再生する。ally は F1 からブロックUI（Blockly）で組む。
  // 対戦実行はアプリ層ファサード runStage() 経由。設計は docs/design/execution-model.md を参照。
  // 表示部品は $lib/components/arena/ に分離し、ここは状態オーケストレーションに徹する。
  import { tick } from "svelte";
  import Icon from "@iconify/svelte";
  import { battleFacade, stageSelection } from "$lib/presentation/stores/battle.svelte";
  import { programCost, type Program } from "$lib/domain";
  import BlocklyEditor from "$lib/presentation/components/building/BlocklyEditor.svelte";
  import CapacityGauge from "$lib/presentation/components/building/CapacityGauge.svelte";
  import BattlePodViewer from "$lib/presentation/components/spectating/BattlePodViewer.svelte";
  import PlaybackController from "$lib/presentation/components/spectating/PlaybackController.svelte";
  import AutomatonStatusViewer from "$lib/presentation/components/spectating/AutomatonStatusViewer.svelte";
  import ResultOverlay from "$lib/presentation/components/spectating/ResultOverlay.svelte";
  import ProgramViewer from "$lib/presentation/components/inspecting/ProgramViewer.svelte";
  import { automatonIcon } from "$lib/presentation/utils/labels";
  import { fade } from "svelte/transition";

  // ファサードと選択中ステージは共有ストア（合成ルート）から参照する。
  // ステージ選択 UI はヘッダーに置き、選び直すと盤面・敵・CP 上限が差し替わる。
  const facade = battleFacade;
  const stageId = $derived(stageSelection.id);
  const stage = $derived(facade.getStage(stageId));

  // HP バーの満タン基準＝初期 HP。選択ステージの初期配置から id → 初期 HP を引く。
  const maxHpById = $derived<Record<string, number>>(
    Object.fromEntries(stage.initial.automatons.map((a) => [a.id, a.hp])),
  );

  // ally の Program はブロックUI から供給される（継ぎ目は runStage の引数＝Program で確定済み）。
  // Blockly を編集の SSoT とし、allyProgram は onProgramChange から流れてくる読み取り専用の断面。
  let allyProgram = $state<Program>([]);

  // BlocklyEditor への参照。お手本読み込みは allyProgram を直接書き換えず、この load() を通して
  // Blockly に流し込む（Blockly → Program の順方向で allyProgram が更新される）。
  let editor = $state<BlocklyEditor>();

  // --- お手本プリセット：ブロックで組む前に挙動を確かめるための見本。 ---
  // 選ぶと Blockly に復元され、そこから allyProgram が再生成される。
  interface AllyPreset {
    readonly label: string;
    readonly program: Program;
  }

  const ALLY_PRESETS: Record<string, AllyPreset> = {
    counter: {
      label: "対抗（近づいたら攻撃）",
      program: [
        {
          kind: "repeat",
          count: 100,
          body: [
            {
              kind: "if",
              cond: { kind: "sensor", sensor: "enemyAhead" },
              then: [{ kind: "call", cmd: "attack" }],
              else: [{ kind: "call", cmd: "stepForward" }],
            },
          ],
        },
      ],
    },
    loadAttack: {
      label: "負荷攻撃（近づいたら DDoS）",
      program: [
        {
          kind: "repeat",
          count: 100,
          body: [
            {
              kind: "if",
              cond: { kind: "sensor", sensor: "enemyAhead" },
              then: [{ kind: "call", cmd: "loadAttack" }],
              else: [{ kind: "call", cmd: "stepForward" }],
            },
          ],
        },
      ],
    },
    naive: {
      label: "素朴（前進するだけ）",
      program: [{ kind: "repeat", count: 100, body: [{ kind: "call", cmd: "stepForward" }] }],
    },
    idle: {
      label: "待機（動かない）",
      program: [],
    },
  };

  const run = $derived(facade.runStage(stageId, allyProgram));
  const frames = $derived(run.frames);
  const result = $derived(run.result);

  let frameIndex = $state(0);
  let playing = $state(false);

  // 盤面・自他プログラムは観戦ビューに常時表示し、構築（Blockly エディタ＋お手本）だけを
  // ドロワーに畳む。`観る → 直す → また観る` の文脈を切らさないため（docs/design/ui-screen-design.md）。
  let drawerOpen = $state(false);

  // 構築ドロワーのメイン領域（Blockly の場所）の表示。ブロック編集 / エディタ編集 / レジストリ を切替える。
  // エディタ編集＝ブロックから生成したコードの表示（ブロック⇄実コードの対応を見せる B面の芽。テキスト編集は未対応）。
  // レジストリに機能（ビルド＆push/版管理/deploy/削除）を足しても、この面の中を埋めるだけで済む。
  let mainView = $state<"edit" | "code" | "registry">("edit");

  const current = $derived(frames[Math.min(frameIndex, frames.length - 1)]);
  const lastIndex = $derived(frames.length - 1);

  // 構築ドロワーの参照レールに出す初期盤面（実行前の配置）。地形と初期位置を見て作戦を組むため。
  const initialFrame = $derived(frames[0]);

  // CP（作成予算）の消費量。組んだブロック数から算出する（戦闘状態とは独立）。
  const cpUsed = $derived(programCost(allyProgram));

  // 決着の表示は「観戦が決着フレームに到達したとき」に出す（結果を先にネタバレしない）。
  const decided = $derived(current.winner !== null);

  // 構築ドロワーを開く＝直す。編集中は再生を止め、まず編集面を出す。
  function openDrawer() {
    drawerOpen = true;
    playing = false;
    mainView = "edit";
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

  // ドロワーを開く／編集面に戻すと Blockly の表示領域が変わる。transform で開くと
  // ResizeObserver が発火しないため、DOM 反映（tick）後に明示的に resize してスクロールバーを正す。
  $effect(() => {
    if (!drawerOpen || mainView !== "edit") return;
    tick().then(() => editor?.resize());
  });
</script>

<!-- 一画面（iPad 横向き前提・スクロール無し）：ヘッダーの残り高を埋め、はみ出しは内側で吸収。 -->
<div class="mx-auto flex h-full max-w-6xl flex-col gap-3 overflow-hidden p-3">
  <!-- ステージ文脈：枠なしの細い1行（名前＋ゴール）。選択はヘッダーの「ステージ進行」に委ねる。 -->
  <p class="shrink-0 text-sm"><span class="font-bold">{stage.label}</span> — {stage.goal}</p>

  <!-- 観戦ビュー（常時表示）。横向き一画面を 1:2:1 の3カラムに割る。
       左=Ally／右=Enemy は各陣営の「ステータス＋プログラム」を縦に積む（コードは縦伸びなので縦カラムが噛み合う）。
       中央=盤面を主役に据える（正方形・迷路化を見越し、横長帯を前提にしない）。
       frameIndex=0 の間は初期配置、再生すると対戦経過が同じ盤面に流れる。 -->
  <section class="flex min-h-0 flex-1 gap-4">
    <!-- 左カラム（幅比1）：Ally のステータス（上）＋プログラム（下・フル高）。
         実行中は current の active でハイライト。識別は小アイコンのみ（名前はステータス側）。 -->
    <div class="flex min-h-0 flex-1 flex-col gap-2">
      <AutomatonStatusViewer {frames} {frameIndex} id="ally" maxHp={maxHpById.ally} />
      <ProgramViewer program={allyProgram} activeId={current.active?.ally} fill showFollow />
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

    <!-- 右カラム（幅比1）：Enemy のステータス（上）＋プログラム（下・フル高）。 -->
    <div class="flex min-h-0 flex-1 flex-col gap-2">
      <AutomatonStatusViewer {frames} {frameIndex} id="enemy" maxHp={maxHpById.enemy} />
      <ProgramViewer program={stage.enemy} activeId={current.active?.enemy} fill showFollow />
    </div>
  </section>

  <!-- 下バー：構築ドロワーのトリガー。ドロワーと同じ「下から」に置き、出現場所と一致させる。 -->
  <button
    class="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-6 py-3 text-base font-bold text-white hover:bg-blue-700"
    onclick={openDrawer}
  >
    <Icon icon="mdi:hammer-wrench" class="size-5" /> プログラミング
  </button>
</div>

<!-- 構築ボトムドロワー＝作業台：Blockly（大）＋参照レール（初期盤面・敵コード・お手本）。
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
  class="fixed inset-x-0 bottom-0 z-50 flex h-[92dvh] flex-col gap-3 rounded-t-xl bg-white p-4 shadow-xl transition-transform duration-300 {drawerOpen
    ? 'translate-y-0'
    : 'translate-y-full'}"
>
  <div class="flex shrink-0 items-center justify-between gap-2">
    <!-- 左：切替タブ＋CP ゲージ（タブと同じ行＝Blockly 上端を右の参照レールに揃える）。 -->
    <div class="flex items-center gap-4">
      <!-- メイン領域の切替タブ：ブロック編集 / エディタ編集 / レジストリ（同じ大きさで入れ替える）。 -->
      <div class="flex items-center gap-1">
        {#snippet tab(value: "edit" | "code" | "registry", icon: string, label: string)}
          <button
            class="inline-flex items-center gap-1 rounded border px-3 py-1 text-sm {mainView === value
              ? 'border-gray-800 bg-gray-800 text-white'
              : 'border-gray-400 hover:bg-gray-100'}"
            onclick={() => (mainView = value)}
          >
            <Icon {icon} class="size-4" />
            {label}
          </button>
        {/snippet}
        {@render tab("edit", "mdi:puzzle-outline", "ブロック編集")}
        {@render tab("code", "mdi:keyboard-outline", "エディタ編集")}
        {@render tab("registry", "mdi:package-variant", "レジストリ")}
      </div>
      <CapacityGauge used={cpUsed} limit={stage.capacity} />
    </div>
    <button
      class="inline-flex items-center gap-1 rounded border border-gray-400 bg-white px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
      onclick={() => (drawerOpen = false)}
    >
      閉じる <Icon icon="mdi:close" class="size-4" />
    </button>
  </div>

  <!-- メイン領域（編集 ⇄ レジストリ）＋参照レール（右・固定幅）。 -->
  <div class="flex min-h-0 flex-1 gap-4">
    <!-- メイン領域：Blockly は常時マウント＆サイズ確定のまま裏に残し（切替で組みかけが消えない）、
         レジストリ面は上に重ねてフル領域で出す。機能追加はこの面の中を埋めるだけで済む。 -->
    <div class="relative min-h-0 flex-1">
      <!-- 編集面：Blockly を全高に広げ、上端・下端とも右の参照レールに揃える。
           CP ゲージはヘッダー行（タブと同じ高さ）に出す。
           ブロック編集以外では invisible で隠す＝Blockly のツールボックスが前面に透けるのを防ぐ。
           visibility:hidden なのでサイズは保持され、切替で再描画が壊れない（unmount しない）。 -->
      <div class="h-full {mainView !== 'edit' ? 'invisible' : ''}">
        <BlocklyEditor bind:this={editor} onProgramChange={(p) => (allyProgram = p)} />
      </div>

      {#if mainView === "code"}
        <!-- エディタ編集面（フル領域）：ブロックから生成したコードを表示（読み取り専用）。
             ブロック⇄実コードの対応を見せる B面の芽。テキスト編集の配線は未対応（プレースホルダ）。 -->
        <div class="absolute inset-0 flex flex-col gap-2 overflow-hidden rounded border border-gray-300 bg-white p-3">
          <ProgramViewer
            title="Ally"
            titleIcon={automatonIcon("ally")}
            program={allyProgram}
            activeId={undefined}
            fill
          />
        </div>
      {/if}

      {#if mainView === "registry"}
        <!-- レジストリ管理面（フル領域）。今は お手本からの pull だけ動く。
             ビルド＆push・版（v1→v2）・deploy・削除は裏側未実装（何もしないプレースホルダ）。 -->
        <div class="absolute inset-0 flex flex-col gap-3 overflow-auto rounded border border-gray-300 bg-white p-3">
          <div class="flex shrink-0 items-center justify-between">
            <h3 class="inline-flex items-center gap-1 text-sm font-bold">
              <Icon icon="mdi:package-variant" class="size-4" /> オートマトンイメージ
            </h3>
            <button
              class="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
            >
              <Icon icon="mdi:tray-arrow-up" class="size-4" /> ビルドして保存
            </button>
          </div>

          <!-- 一覧（各行＝オートマトンイメージ）。将来は自ビルド版（name:v1→v2）もここに並ぶ。 -->
          <ul class="flex flex-col gap-2">
            {#each Object.entries(ALLY_PRESETS) as [key, p] (key)}
              <li class="flex items-center justify-between gap-3 rounded border border-gray-200 px-3 py-2">
                <div class="min-w-0">
                  <span class="text-sm">お手本：{p.label}</span>
                  <span class="ml-2 text-xs opacity-50">v1</span>
                </div>
                <div class="flex shrink-0 gap-2">
                  <!-- pull＝Blockly に展開して編集面へ戻る（唯一の実動作）。 -->
                  <button
                    class="rounded border border-gray-400 bg-white px-3 py-1 text-sm hover:bg-gray-100"
                    onclick={() => {
                      editor?.load(p.program);
                      mainView = "edit";
                    }}
                  >
                    pull
                  </button>
                  <!-- deploy / 削除は裏側未実装のプレースホルダ（何もしない）。 -->
                  <button class="rounded border border-gray-300 px-3 py-1 text-sm text-gray-400">deploy</button>
                  <button class="rounded border border-gray-300 px-2 py-1 text-sm text-gray-400" aria-label="削除">
                    <Icon icon="mdi:delete-outline" class="size-4" />
                  </button>
                </div>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>

    <!-- 参照レール（編集・レジストリ両方で常時表示）：作戦の前提＝盤面・敵の手の内。 -->
    <div class="flex min-h-0 w-[26rem] shrink-0 flex-col gap-3 overflow-auto">
      <div class="shrink-0 rounded border border-gray-200 bg-gray-50 p-2">
        <h3 class="mb-1 inline-flex items-center gap-1 text-xs font-bold opacity-70">
          <Icon icon="mdi:view-grid-outline" class="size-4" /> 初期配置
        </h3>
        <BattlePodViewer state={initialFrame} size="sm" />
      </div>

      <ProgramViewer title="Enemy" titleIcon={automatonIcon("enemy")} program={stage.enemy} activeId={undefined} fill />
    </div>
  </div>
</aside>
