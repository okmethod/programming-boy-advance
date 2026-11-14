<script lang="ts">
  // バトルポッドの盤面描画（表示専用）。1 フレーム分の BattleState を受けてグリッドと勝敗を描く。
  import Icon from "@iconify/svelte";
  import type { BattleState, Direction } from "#lib/application";
  import { automatonIcon } from "#lib/presentation/utils/labels";

  interface BattlePodViewerProps {
    state: BattleState;
    // lg=観戦（中央カラムの残り領域にコンテナfitする可変盤面）／sm=参照レールの初期配置（高さ上限付きの小箱にフィット）。
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
  // 未起動の ally（allyInactive）は HP0 でも休眠であって撃破ではないので、×目（撃破顔）にはしない。
  function iconFor(e: BattleState["automatons"][number]): string {
    if (stubEnemy && e.id === "enemy") return STUB_ICON;
    const inactiveAlly = allyInactive && e.id === "ally";
    return automatonIcon(e.id, e.hp <= 0 && !inactiveAlly);
  }

  // 開始前など ally を非活性に見せたいときだけ、ally スプライトをくすませるクラスを返す。
  function inactiveClass(e: BattleState["automatons"][number]): string {
    return allyInactive && e.id === "ally" ? "opacity-40 grayscale" : "";
  }

  const cols = $derived(state.grid.width);
  const rows = $derived(state.grid.height);

  const fit = $derived(size === "lg");

  // セル辺の基準式＝親（container-type:size）の余白(cqw/cqh)に収まる最大正方形。
  // 幅・高さ双方で割り、短い方に合わせる＝列数・行数のどちらが増えても親箱からはみ出さない。
  // gap=0.25rem・padding=0.5rem(両側で1rem)を差し引く。
  const cellFit = $derived(
    `(100cqw - 1rem - ${cols - 1} * 0.25rem) / ${cols}, (100cqh - 1rem - ${rows - 1} * 0.25rem) / ${rows}`,
  );
  // lg＝観戦：親箱（中央カラムの残り領域）いっぱいにフィット（上限なし・8×8/迷路化に耐える）。
  const fitStyle = $derived(
    `--cell:min(${cellFit});grid-template-columns:repeat(${cols}, var(--cell));grid-auto-rows:var(--cell);`,
  );
  // sm＝参照：高さ上限付きの小箱に、縦横どちらが長い盤面でも収まるようフィット。
  // セル辺は 2.25rem を上限にし、横長(corridor)・縦長はレール内に縮めて全体を見せる（固定セルだとはみ出す）。
  const smStyle = $derived(
    `--cell:min(2.25rem, ${cellFit});grid-template-columns:repeat(${cols}, var(--cell));grid-auto-rows:var(--cell);`,
  );

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

  // セル(x,y)と隣接(nx,ny)の間に壁辺があるか。往来は対称なので両順で一致を見る。
  function wallBetweenCells(x: number, y: number, nx: number, ny: number): boolean {
    return state.grid.walls.some(
      (w) =>
        (w.a.x === x && w.a.y === y && w.b.x === nx && w.b.y === ny) ||
        (w.a.x === nx && w.a.y === ny && w.b.x === x && w.b.y === y),
    );
  }

  // セルの壁辺を太ボーダーで示すクラス。動的クラスは Tailwind スキャナー検出のためリテラルで連結する。
  function wallClass(x: number, y: number): string {
    const sides: string[] = [];
    if (wallBetweenCells(x, y, x, y - 1)) sides.push("border-t-4 border-t-gray-700");
    if (wallBetweenCells(x, y, x, y + 1)) sides.push("border-b-4 border-b-gray-700");
    if (wallBetweenCells(x, y, x - 1, y)) sides.push("border-l-4 border-l-gray-700");
    if (wallBetweenCells(x, y, x + 1, y)) sides.push("border-r-4 border-r-gray-700");
    return sides.join(" ");
  }
</script>

<!-- セル群（1枚のグリッドに row-major で並べる）。アイコン/シェブロンのサイズはセルに対する割合で渡し、
     fit でセルが伸縮しても字形の比率を保つ。 -->
{#snippet cells(iconClass: string, chevronClass: string)}
  {#each Array(rows) as _, y (y)}
    {#each Array(cols) as _, x (x)}
      {@const e = automatonAt(state, x, y)}
      <div class="relative flex items-center justify-center rounded border border-gray-300 bg-white {wallClass(x, y)}">
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

<!-- 盤面を container-type:size の箱に中央寄せでフィットさせる。lg は残り領域いっぱい、
     sm は高さ上限付きの小箱（縦横どちらが長くてもその中へ収める）。cqw/cqh はこの箱で測る。 -->
<div class="grid {fit ? 'size-full' : 'h-36 w-full'} place-items-center [container-type:size]">
  <div class="grid gap-1 rounded bg-gray-200 p-2" style={fit ? fitStyle : smStyle}>
    {@render cells("h-1/2 w-1/2", "h-1/4 w-1/4")}
  </div>
</div>
