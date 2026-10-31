<script lang="ts">
  // CP（キャパシティ）ゲージ：プログラム作成予算の消費量を表示する（編集側）。
  // CP は戦闘には登場しない作成予算（docs/design/ui-screen-design.md）。
  // 予算を 1 ブロック＝1 セグメントの離散バーで示し、ブロック game の見た目に合わせる。
  interface CapacityGaugeProps {
    used: number;
    limit: number;
  }

  let { used, limit }: CapacityGaugeProps = $props();

  const over = $derived(used > limit);
  // 上限を超えた分も見えるよう、表示セグメント数は used と limit の大きい方に合わせる。
  const segments = $derived(Math.max(limit, used));
</script>

<div class="flex flex-col gap-1">
  <div class="flex items-baseline gap-2">
    <span class="text-xs font-bold">CP</span>
    <span class="text-xs tabular-nums {over ? 'text-red-600' : 'opacity-70'}">{used} / {limit}</span>
    {#if over}
      <span class="text-xs font-bold text-red-600">上限オーバー</span>
    {/if}
  </div>
  <div class="flex flex-wrap gap-0.5">
    {#each Array(segments) as _, i (i)}
      <!-- i < limit は予算枠。枠内の消費=sky、枠外の消費(超過)=red、未消費=gray。 -->
      <span
        class="h-3 w-3 rounded-sm border border-gray-300 {i >= limit
          ? 'bg-red-500'
          : i < used
            ? 'bg-sky-500'
            : 'bg-gray-100'}"
      ></span>
    {/each}
  </div>
</div>
