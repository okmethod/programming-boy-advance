<script lang="ts">
  // バトルポッドの盤面描画（表示専用）。1 フレーム分の BattleState を受けてグリッドと勝敗を描く。
  import Icon from "@iconify/svelte";
  import type { BattleState, Direction } from "$lib/application";
  import { automatonIcon } from "$lib/presentation/utils/labels";

  interface BattlePodViewerProps {
    state: BattleState;
    // lg=観戦（中央カラムの残り領域にコンテナfitする可変盤面）／sm=参照レールの初期配置（小さい固定セル）。
    size?: "lg" | "sm";
    // 試運転のサンドバッグ：enemy スロットを別アイコンで描く（本物の敵と区別する）。
    stubEnemy?: boolean;
    // 自キャラを非活性に見せる（開始前など）。ally スプライトをくすませて「まだ動いていない」を示す。
    allyInactive?: boolean;
  }

  let { state, size = "lg", stubEnemy = false, allyInactive = false }: BattlePodViewerProps = $props();

  // stub（テストダブル）のアイコン。サンドバッグ役のゴーストで、本物の敵（怒りロボ）とは見た目で分ける。
  const STUB_ICON = "mdi:ghost";

  // セルに描くアイコン名。サンドバッグ指定時は enemy を的アイコンにし、それ以外は通常の陣営アイコン（撃破顔含む）。
  function iconFor(e: BattleState["automatons"][number]): string {
    return stubEnemy && e.id === "enemy" ? STUB_ICON : automatonIcon(e.id, e.hp <= 0);
  }

  // 開始前など ally を非活性に見せたいときだけ、ally スプライトをくすませるクラスを返す。
  function inactiveClass(e: BattleState["automatons"][number]): string {
    return allyInactive && e.id === "ally" ? "opacity-40 grayscale" : "";
  }

  const cols = $derived(state.grid.width);
  const rows = $derived(state.grid.height);

  // lg＝観戦：親（container-type:size）の幅/高(cqw/cqh)に収まる最大正方形をセル辺にする。
  // 列数・行数が増えても盤面が親箱からはみ出さない（8×8・迷路化に耐える）。gap=0.25rem,padding=0.5rem。
  const fit = $derived(size === "lg");
  const fitStyle = $derived(
    `--cell:min((100cqw - 1rem - ${cols - 1} * 0.25rem) / ${cols}, (100cqh - 1rem - ${rows - 1} * 0.25rem) / ${rows});` +
      `grid-template-columns:repeat(${cols}, var(--cell));grid-auto-rows:var(--cell);`,
  );
  // sm＝参照：固定 2.25rem のセルで小さく描く。
  const smStyle = $derived(`grid-template-columns:repeat(${cols}, 2.25rem);grid-auto-rows:2.25rem;`);

  // 向きシェブロン（> < ∧ ∨）。向いている側にアイコンと密着させて出す。
  function dirChevron(dir: Direction): string {
    const icons: Record<Direction, string> = {
      up: "mdi:chevron-up",
      down: "mdi:chevron-down",
      left: "mdi:chevron-left",
      right: "mdi:chevron-right",
    };
    return icons[dir];
  }

  // シェブロンを「向いている側の縁」に絶対配置する位置クラス。ロボは中央固定で矢印だけ動く。
  // テンプレート文字列だと Tailwind スキャナーに検出されないため、分岐ごとにリテラルを返す。
  function dirChevronPos(dir: Direction): string {
    switch (dir) {
      case "up":
        return "left-1/2 top-0 -translate-x-1/2";
      case "down":
        return "left-1/2 bottom-0 -translate-x-1/2";
      case "left":
        return "left-0 top-1/2 -translate-y-1/2";
      case "right":
        return "right-0 top-1/2 -translate-y-1/2";
    }
  }

  function automatonAt(s: BattleState, x: number, y: number) {
    return s.automatons.find((e) => e.pos.x === x && e.pos.y === y);
  }
</script>

<!-- セル群（1枚のグリッドに row-major で並べる）。アイコン/シェブロンのサイズはセルに対する割合で渡し、
     fit でセルが伸縮しても字形の比率を保つ。 -->
{#snippet cells(iconClass: string, chevronClass: string)}
  {#each Array(rows) as _, y (y)}
    {#each Array(cols) as _, x (x)}
      {@const e = automatonAt(state, x, y)}
      <div class="relative flex items-center justify-center rounded border border-gray-300 bg-white">
        {#if e}
          <!-- スプライトは中央固定。向きシェブロンだけを向いている側の縁に絶対配置（向き＝位置＋形の二重表現）。 -->
          <!-- スプライトは重心がやや下。矢印（縦中央）との見た目のズレを埋めるため、スプライトを少し上へ寄せる。 -->
          <!-- スプライトは黒で描く。 -->
          <Icon icon={iconFor(e)} class="-translate-y-[10%] text-black {iconClass} {inactiveClass(e)}" />
          <Icon
            icon={dirChevron(e.dir)}
            class="absolute text-gray-400 {chevronClass} {dirChevronPos(e.dir)} {inactiveClass(e)}"
          />
        {/if}
      </div>
    {/each}
  {/each}
{/snippet}

{#if fit}
  <!-- 観戦：親箱の残り領域いっぱいに置き、その中で盤面を中央寄せ。container-type:size で cqw/cqh を測る。 -->
  <div class="grid size-full place-items-center [container-type:size]">
    <div class="grid gap-1 rounded bg-gray-200 p-2" style={fitStyle}>
      {@render cells("h-1/2 w-1/2", "h-1/4 w-1/4")}
    </div>
  </div>
{:else}
  <!-- 参照：内容ぴったりの小さい固定盤面。 -->
  <div class="inline-grid gap-1 rounded bg-gray-200 p-2" style={smStyle}>
    {@render cells("size-5", "size-3")}
  </div>
{/if}
