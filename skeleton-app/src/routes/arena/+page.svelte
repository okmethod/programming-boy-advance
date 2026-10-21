<script lang="ts">
  // 観戦（スペクテイター）PoC。
  // 固定ステージに対し、プレイヤーの ally プログラムを「外部供給」して対戦させ、
  // 決定的なフレーム列を再生する。ally は F1 からブロックUI（Blockly）で組む。
  // 対戦実行はアプリ層ファサード runStage() 経由。設計は docs/design/execution-model.md を参照。
  // 表示部品は $lib/components/arena/ に分離し、ここは状態オーケストレーションに徹する。
  import { runStage, STAGE_01 } from "$lib/application";
  import type { Program } from "$lib/domain";
  import BlocklyEditor from "$lib/components/BlocklyEditor.svelte";
  import BattleField from "./_components/BattleField.svelte";
  import PlaybackControls from "./_components/PlaybackControls.svelte";
  import ProgramText from "./_components/ProgramText.svelte";
  import { winnerText } from "./_components/labels";

  const stage = STAGE_01;

  // ally の Program はブロックUI から供給される（継ぎ目は runStage の引数＝Program で確定済み）。
  let allyProgram = $state<Program>([]);

  // --- お手本プリセット：ブロックで組む前に挙動を確かめるための見本。 ---
  // 選ぶと allyProgram に直接セットする（Blockly ワークスペースへの復元は後続課題）。
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
              cond: "enemyAhead",
              then: [{ kind: "call", cmd: "attack" }],
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

  const run = $derived(runStage(stage, allyProgram));
  const frames = $derived(run.frames);
  const result = $derived(run.result);

  let frameIndex = $state(0);
  let playing = $state(false);

  const current = $derived(frames[Math.min(frameIndex, frames.length - 1)]);
  const lastIndex = $derived(frames.length - 1);

  // ally プログラムが変わったら先頭に戻す。
  $effect(() => {
    void allyProgram;
    frameIndex = 0;
    playing = false;
  });
</script>

<div class="mx-auto flex max-w-3xl flex-col gap-4 p-4">
  <h1 class="text-xl font-bold">バトルポッド観戦 (PoC)</h1>
  <p class="text-sm opacity-70">
    固定ステージに ally プログラムを外部供給して対戦させる最小ビュー。ally はブロックUIで組む（お手本プリセットあり）。
  </p>

  <!-- ステージ提示 -->
  <div class="rounded border border-gray-300 bg-gray-50 p-3">
    <h2 class="text-sm font-bold">{stage.label}</h2>
    <p class="text-sm">{stage.goal}</p>
    <p class="text-xs opacity-70">敵：{stage.enemyLabel}</p>
  </div>

  <!-- ally プログラムをブロックで組む -->
  <div>
    <h2 class="mb-1 text-sm font-bold">🤖 自キャラのプログラムをブロックで組む</h2>
    <BlocklyEditor onProgramChange={(p) => (allyProgram = p)} />
  </div>

  <!-- お手本プリセット（allyProgram に直接セット） -->
  <div>
    <h2 class="mb-1 text-sm font-bold">お手本を読み込む</h2>
    <div class="flex flex-wrap gap-2">
      {#each Object.entries(ALLY_PRESETS) as [key, p] (key)}
        <button
          class="rounded border border-gray-400 bg-white px-3 py-1 text-sm text-gray-800 hover:bg-gray-100"
          onclick={() => (allyProgram = p.program)}
        >
          {p.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- 盤面 -->
  <BattleField state={current} />

  <!-- 再生コントロール -->
  <PlaybackControls bind:frameIndex bind:playing {lastIndex} clock={current.clock} />

  <!-- 結果サマリ（最終フレームから導いた確定結果） -->
  <p class="text-sm opacity-70">結果：{winnerText(result.winner)}（{result.clocks} クロック）</p>

  <!-- プログラム表示 -->
  <div class="grid grid-cols-2 gap-4">
    <ProgramText title="🤖 自キャラ（Ally）" program={allyProgram} />
    <ProgramText title="👾 敵キャラ（Enemy）" program={stage.enemy} />
  </div>
</div>
