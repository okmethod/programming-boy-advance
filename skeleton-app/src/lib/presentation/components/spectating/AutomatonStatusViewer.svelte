<script lang="ts">
  // オートマトンステータス（観戦側）：HP と BP を「量の性質」に合わせて別イディオムで描く。
  //
  //   HP=空きヒープ（残量）。恒久リソースで、状態＝今の残量がすべて（履歴は低情報）。
  //     → ブロック（ページ/セグメント）の数で残量を示す。回復・増強でも現在値を描くだけなので崩れない。
  //   BP=CPU 負荷。一時リソースで刻々と揺れ、状態＝軌跡（上がってる/跳ねた/冷めてる）が本質。
  //     → 時系列の波形で見せる（残高 vs 心電図の違い）。この非対称が2リソースの性質差を無言で語る。
  //
  // ネタバレ防止：BP 波形の横軸は全バトル長で固定しつつ、描画は現在フレームまで（右側＝未来は空白）。
  import Icon from "@iconify/svelte";
  import type { AutomatonId, BattleState } from "$lib/domain";
  import { BATTLE_PARAMS } from "$lib/domain";
  import { automatonIcon, automatonName } from "$lib/presentation/utils/labels";

  interface AutomatonStatusViewerProps {
    frames: readonly BattleState[];
    frameIndex: number;
    id: AutomatonId;
    // ヒープ容量＝初期 HP（ブロックの総数）。
    maxHp: number;
  }

  let { frames, frameIndex, id, maxHp }: AutomatonStatusViewerProps = $props();

  const bpMax = BATTLE_PARAMS.bpMax;

  // BP 波形の SVG 座標系（preserveAspectRatio=none で横に引き伸ばす）。
  const VBW = 100;
  const VBH = 24;

  // 各フレームの該当オートマトンを時系列で取り出す（BP 波形の元データ）。
  const series = $derived(frames.map((f) => f.automatons.find((a) => a.id === id)));

  // 現在フレーム位置。BP 波形の横軸は全バトル長で固定し、描画はここまでに絞る（ネタバレ防止）。
  const curIndex = $derived(Math.min(frameIndex, frames.length - 1));
  const denom = $derived(Math.max(1, frames.length - 1));
  const bpShown = $derived(series.slice(0, curIndex + 1).map((a) => a?.bp ?? 0));

  // 現在フレームの瞬間値（数値・色・フリーズ判定）。
  const cur = $derived(series[curIndex]);
  const hp = $derived(cur?.hp ?? 0);
  const bp = $derived(cur?.bp ?? 0);
  const defeated = $derived(hp <= 0);
  const freezeRemaining = $derived(cur?.freezeRemaining ?? 0);
  const frozen = $derived(freezeRemaining > 0);

  // HP が残りわずか／BP が高いときは警告色にする（しきい値はひとまず暫定）。
  const hpDanger = $derived(defeated || hp / Math.max(1, maxHp) <= 0.34);
  const bpDanger = $derived(frozen || bp / Math.max(1, bpMax) >= 0.8);

  // 再生ヘッドの x 座標（＝描画の右端＝現在フレーム）。
  const headX = $derived((curIndex / denom) * VBW);

  // BP 値を SVG の y 座標に変換する（上端 0＝天井＝フリーズ）。
  function valueToY(v: number): number {
    return VBH - (Math.min(v, bpMax) / Math.max(1, bpMax)) * VBH;
  }

  // BP 時系列を折れ線パスに変換する（x は全バトル長で正規化）。
  function linePath(values: number[]): string {
    return values
      .map((v, i) => `${i === 0 ? "M" : "L"}${((i / denom) * VBW).toFixed(2)},${valueToY(v).toFixed(2)}`)
      .join(" ");
  }

  // 折れ線の下を塗りつぶすエリアパス（底辺で閉じる）。
  function areaPath(values: number[]): string {
    const line = linePath(values);
    if (line === "") return "";
    const lastX = (((values.length - 1) / denom) * VBW).toFixed(2);
    return `${line} L${lastX},${VBH} L0,${VBH} Z`;
  }
</script>

<!-- 計測器セクション：陣営カラムの黒パネル上段。枠・背景は親パネルが持つのでここは中身だけ（p-3 で余白）。 -->
<div class="flex w-full flex-col gap-2 p-3">
  <!-- 見出し：陣営アイコン＋名前。フリーズ中は山場としてバッジを出す。 -->
  <div class="flex items-center gap-1.5">
    <Icon icon={automatonIcon(id, defeated)} class="size-5" />
    <span class="text-sm font-bold">{automatonName(id)}</span>
    {#if frozen}
      <span
        class="ml-auto inline-flex items-center gap-0.5 rounded bg-red-500/20 px-1 text-[10px] font-bold text-red-300"
      >
        <Icon icon="mdi:snowflake" class="size-3" />
        {freezeRemaining}
      </span>
    {/if}
  </div>

  <!-- HP：空きヒープの残量を全幅セグメントバーで（緑＝残り、消灯＝消費済み。残りわずかで赤）。
       BP チャートと同じ黒い液晶ストリップに載せ、幅・高さを揃えて「1つの計器」に見せる。 -->
  <div class="flex items-center gap-2">
    <span class="w-8 shrink-0 text-xs font-bold text-gray-500">HP</span>
    <div class="flex h-7 min-w-0 flex-1 items-stretch gap-1 rounded-sm bg-black/40 p-1">
      {#each Array(maxHp) as _, i (i)}
        <span class="flex-1 {i < hp ? (hpDanger ? 'bg-red-500' : 'bg-green-500') : 'bg-white/5'}"></span>
      {/each}
    </div>
    <!-- 現在値（分子）を主役に大きく、容量（分母）は淡色の参照に。magnitude は数値が担う。
         分子・分母を各 2 桁幅（2ch）の右揃えにして、スラッシュ位置を固定しつつ両数字を右揃えする。 -->
    <span class="inline-flex shrink-0 items-baseline tabular-nums {hpDanger ? 'text-red-400' : 'text-gray-100'}">
      <span class="w-[2ch] text-right text-base font-bold">{hp}</span>
      <span class="text-xs text-gray-500">/</span>
      <span class="w-[2ch] text-right text-xs text-gray-500">{maxHp}</span>
    </span>
  </div>

  <!-- BP：CPU 負荷の軌跡を時系列波形で（溜まって天井＝フリーズ）。 -->
  <div class="flex items-center gap-2">
    <span class="w-8 shrink-0 text-xs font-bold text-gray-500">BP</span>
    <div class="min-w-0 flex-1">
      <svg viewBox="0 0 {VBW} {VBH}" preserveAspectRatio="none" class="h-7 w-full rounded-sm bg-black/40">
        <!-- 方眼：控えめなガイド線（間引いて低コントラスト。小サイズでのノイズを避ける）。 -->
        {#each [33, 66] as gx (gx)}
          <line
            x1={gx}
            y1="0"
            x2={gx}
            y2={VBH}
            class="stroke-gray-700/35"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
        {/each}
        {#each [8, 16] as gy (gy)}
          <line
            x1="0"
            y1={gy}
            x2={VBW}
            y2={gy}
            class="stroke-gray-700/35"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
        {/each}
        <!-- 履歴：塗り＋折れ線（現在フレームまで）。 -->
        <path d={areaPath(bpShown)} class={frozen ? "fill-red-500/20" : "fill-amber-500/20"} />
        <path
          d={linePath(bpShown)}
          fill="none"
          class={frozen ? "stroke-red-400" : "stroke-amber-400"}
          stroke-width="1.5"
          vector-effect="non-scaling-stroke"
        />
        <!-- 天井ライン：平時は控えめグレー、高負荷（bpDanger）で赤く主張する（静止時に赤が主役化しないように）。 -->
        <line
          x1="0"
          y1="1"
          x2={VBW}
          y2="1"
          class={bpDanger ? "stroke-red-500/80" : "stroke-gray-600/40"}
          stroke-width="1"
          stroke-dasharray="3 2"
          vector-effect="non-scaling-stroke"
        />
        <!-- 再生ヘッド：描画の右端＝現在フレーム（ここから右は未観測）。 -->
        <line
          x1={headX}
          y1="0"
          x2={headX}
          y2={VBH}
          class="stroke-white/70"
          stroke-width="1"
          vector-effect="non-scaling-stroke"
        />
      </svg>
    </div>
    <span class="inline-flex shrink-0 items-baseline tabular-nums {bpDanger ? 'text-red-400' : 'text-gray-100'}">
      <span class="w-[2ch] text-right text-base font-bold">{bp}</span>
      <span class="text-xs text-gray-500">/</span>
      <span class="w-[2ch] text-right text-xs text-gray-500">{bpMax}</span>
    </span>
  </div>
</div>
