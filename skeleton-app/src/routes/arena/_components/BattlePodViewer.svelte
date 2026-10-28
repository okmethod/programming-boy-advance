<script lang="ts">
  // バトルポッドの盤面描画（表示専用）。1 フレーム分の BattleState を受けてグリッドと勝敗を描く。
  import type { AutomatonId, BattleState, Direction } from "$lib/domain";
  import { winnerText } from "./labels";

  interface BattleFieldProps {
    state: BattleState;
  }

  let { state }: BattleFieldProps = $props();

  function dirArrow(dir: Direction): string {
    const arrows: Record<Direction, string> = { up: "↑", right: "→", down: "↓", left: "←" };
    return arrows[dir];
  }

  function glyph(id: AutomatonId): string {
    return id === "ally" ? "🤖" : "👾";
  }

  function automatonAt(s: BattleState, x: number, y: number) {
    return s.automatons.find((e) => e.pos.x === x && e.pos.y === y);
  }
</script>

<div class="flex flex-col gap-2">
  <div class="inline-flex flex-col gap-1 self-start rounded bg-gray-200 p-2">
    {#each Array(state.grid.height) as _, y (y)}
      <div class="flex gap-1">
        {#each Array(state.grid.width) as _, x (x)}
          {@const e = automatonAt(state, x, y)}
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

  {#if state.winner}
    <p class="text-lg font-bold">{winnerText(state.winner)}</p>
  {/if}
</div>
