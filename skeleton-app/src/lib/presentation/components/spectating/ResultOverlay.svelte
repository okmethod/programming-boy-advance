<script lang="ts">
  // 結果オーバーレイ：決着時に観戦（盤面）の上へ重ねる（docs/design/ui-screen-design.md）。
  // 独立画面にはせず、勝敗と次アクションだけを薄く重ねて画面数を増やさない。
  import Icon from "@iconify/svelte";
  import type { Winner } from "$lib/domain";
  import { winnerText } from "$lib/presentation/utils/labels";

  interface ResultOverlayProps {
    winner: Winner;
    // 先頭フレームへ戻して対戦をもう一度観る（リプレイ）。編集は観戦画面の「組む」に委ねる。
    onReplay: () => void;
  }

  let { winner, onReplay }: ResultOverlayProps = $props();

  // 勝敗で見出しバッジ・ボタン色を出し分ける。Tailwind スキャナ対策で動的生成はせずリテラルを切替える。
  const badgeLabel = $derived(winner === "ally" ? "WIN" : winner === "enemy" ? "LOSE" : "DRAW");
  const badgeClass = $derived(
    winner === "ally"
      ? "bg-amber-100 text-amber-700"
      : winner === "enemy"
        ? "bg-gray-200 text-gray-600"
        : "bg-sky-100 text-sky-700",
  );
  const retryClass = $derived(winner === "ally" ? "bg-amber-500 hover:bg-amber-600" : "bg-gray-800 hover:bg-gray-700");
</script>

<!-- 親は relative を持つ観戦コンテナ。inset-0 で盤面全体を覆い、中央にカードを浮かせる。 -->
<div class="absolute inset-0 flex items-center justify-center rounded bg-black/60">
  <div class="flex min-w-56 flex-col items-center gap-3 rounded-xl bg-white px-8 py-6 shadow-2xl">
    <span class="rounded-full px-3 py-0.5 text-xs font-bold tracking-widest {badgeClass}">{badgeLabel}</span>
    <p class="text-xl font-bold text-gray-900">{winnerText(winner)}</p>
    <!-- TODO: 「次へ」はステージ進行（進行ルート）導入後に追加する。MVP はリトライのみ。 -->
    <button
      class="inline-flex items-center gap-1 rounded-lg px-6 py-2 text-sm font-bold text-white {retryClass}"
      onclick={onReplay}><Icon icon="mdi:replay" class="size-4" /> もう一度</button
    >
  </div>
</div>
