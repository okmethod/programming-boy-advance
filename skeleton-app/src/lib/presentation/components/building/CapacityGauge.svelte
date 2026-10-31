<script lang="ts">
  // CP（キャパシティ）ゲージ：プログラム作成予算の消費量を表示する（編集側）。
  // CP は戦闘には登場しない作成予算（docs/design/ui-screen-design.md）。
  // HP（ヒープ）と同じく「メモリのメタファー」なので、見た目も HP バーに揃える。
  // 色は作成予算＝黄色系、超過＝赤。
  interface CapacityGaugeProps {
    used: number;
    limit: number;
  }

  let { used, limit }: CapacityGaugeProps = $props();

  const over = $derived(used > limit);
  // 上限を超えた分も見えるよう、表示セグメント数は used と limit の大きい方に合わせる。
  const segments = $derived(Math.max(limit, used));
</script>

<div class="flex items-center gap-2">
  <span class="shrink-0 text-xs font-bold text-gray-500">CP</span>
  <!-- HP バーと同じ溝＋等幅セグメント。枠内の消費=黄、超過=赤、未消費=ごく淡い白。 -->
  <div class="flex h-7 w-44 shrink-0 items-stretch gap-0.5 rounded-sm bg-black/10 p-1">
    {#each Array(segments) as _, i (i)}
      <span class="flex-1 {i >= limit ? 'bg-red-500' : i < used ? 'bg-yellow-400' : 'bg-white/10'}"></span>
    {/each}
  </div>
  <span class="inline-flex shrink-0 items-baseline tabular-nums {over ? 'text-red-600' : 'text-gray-900'}">
    <span class="text-sm font-bold">{used}</span>
    <span class="px-0.5 text-xs text-gray-400">/</span>
    <span class="text-xs text-gray-500">{limit}</span>
  </span>
  {#if over}
    <span class="shrink-0 text-xs font-bold text-red-600">上限オーバー</span>
  {/if}
</div>
