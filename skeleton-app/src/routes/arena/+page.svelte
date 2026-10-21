<script lang="ts">
  // 観戦（スペクテイター）PoC。
  // 固定ステージに対し、プレイヤーの ally プログラムを「外部供給」して対戦させ、
  // 決定的なフレーム列を再生する。ally は F1 からブロックUI（Blockly）で組む。
  // 対戦実行はアプリ層ファサード runStage() 経由。設計は docs/design/execution-model.md を参照。
  import { runStage, STAGE_01 } from "$lib/application";
  import type { AutomatonId, BattleState, Direction, Program, Stmt } from "$lib/domain";
  import BlocklyEditor from "$lib/components/BlocklyEditor.svelte";

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

  // 再生ループ（0.4秒ごとに1フレーム進める）。
  $effect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (frameIndex >= frames.length - 1) {
        playing = false;
      } else {
        frameIndex++;
      }
    }, 400);
    return () => clearInterval(id);
  });

  function dirArrow(dir: Direction): string {
    const arrows: Record<Direction, string> = { up: "↑", right: "→", down: "↓", left: "←" };
    return arrows[dir];
  }

  function glyph(id: AutomatonId): string {
    return id === "ally" ? "🤖" : "👾";
  }

  function automatonAt(state: BattleState, x: number, y: number) {
    return state.automatons.find((e) => e.pos.x === x && e.pos.y === y);
  }

  function programToText(stmts: readonly Stmt[], indent = 0): string {
    return stmts.map((s) => stmtToText(s, indent)).join("\n");
  }

  function stmtToText(s: Stmt, indent: number): string {
    const pad = "  ".repeat(indent);
    switch (s.kind) {
      case "call":
        return `${pad}${s.cmd}()`;
      case "repeat":
        return `${pad}repeat ${s.count}:\n${programToText(s.body, indent + 1)}`;
      case "if": {
        const base = `${pad}if ${s.cond}:\n${programToText(s.then, indent + 1)}`;
        return s.else ? `${base}\n${pad}else:\n${programToText(s.else, indent + 1)}` : base;
      }
      case "while":
        return `${pad}while ${s.cond}:\n${programToText(s.body, indent + 1)}`;
      default:
        return "";
    }
  }

  function winnerText(w: BattleState["winner"]): string {
    if (w === "ally") return "🤖 自キャラの勝ち";
    if (w === "enemy") return "👾 敵キャラの勝ち";
    if (w === "draw") return "引き分け";
    return "";
  }
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
  <div class="inline-flex flex-col gap-1 self-start rounded bg-gray-200 p-2">
    {#each Array(current.grid.height) as _, y (y)}
      <div class="flex gap-1">
        {#each Array(current.grid.width) as _, x (x)}
          {@const e = automatonAt(current, x, y)}
          <div class="flex h-12 w-12 items-center justify-center rounded border border-gray-300 bg-white">
            {#if e}
              <div class="flex flex-col items-center leading-none">
                <span class="text-2xl">{glyph(e.id)}</span>
                <span class="text-[10px] text-gray-600">{dirArrow(e.dir)} hp{e.hp}</span>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>

  <!-- 勝敗 -->
  {#if current.winner}
    <p class="text-lg font-bold">{winnerText(current.winner)}</p>
  {/if}

  <!-- 再生コントロール -->
  <div class="flex items-center gap-2">
    <button
      class="rounded border border-gray-400 px-3 py-1 text-sm hover:bg-gray-100"
      onclick={() => {
        frameIndex = 0;
        playing = false;
      }}>⏮ 最初</button
    >
    <button
      class="rounded border border-gray-400 px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-40"
      disabled={frameIndex === 0}
      onclick={() => (frameIndex = Math.max(0, frameIndex - 1))}>◀</button
    >
    <button
      class="rounded border border-gray-800 bg-gray-800 px-4 py-1 text-sm text-white disabled:opacity-40"
      disabled={frameIndex >= lastIndex}
      onclick={() => (playing = !playing)}>{playing ? "⏸ 停止" : "▶ 再生"}</button
    >
    <button
      class="rounded border border-gray-400 px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-40"
      disabled={frameIndex >= lastIndex}
      onclick={() => (frameIndex = Math.min(lastIndex, frameIndex + 1))}>▶</button
    >
    <span class="ml-2 text-sm tabular-nums">clock {current.clock} ・ {frameIndex} / {lastIndex}</span>
  </div>

  <input type="range" min="0" max={lastIndex} bind:value={frameIndex} class="w-full" />

  <!-- 結果サマリ（最終フレームから導いた確定結果） -->
  <p class="text-sm opacity-70">結果：{winnerText(result.winner)}（{result.clocks} クロック）</p>

  <!-- プログラム表示 -->
  <div class="grid grid-cols-2 gap-4">
    <div>
      <h2 class="mb-1 text-sm font-bold">🤖 自キャラ（Ally）</h2>
      <pre class="overflow-auto rounded bg-gray-900 p-2 text-xs text-green-300">{programToText(allyProgram) ||
          "(なし)"}</pre>
    </div>
    <div>
      <h2 class="mb-1 text-sm font-bold">👾 敵キャラ（Enemy）</h2>
      <pre class="overflow-auto rounded bg-gray-900 p-2 text-xs text-green-300">{programToText(stage.enemy) ||
          "(なし)"}</pre>
    </div>
  </div>
</div>
