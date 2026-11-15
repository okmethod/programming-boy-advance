<script lang="ts">
  // メモリの持ち分を「刻み×枚数枚」で示すピル（例: total=24・grain=8 → 8×3枚）。
  // 「枚」は CapacityAllocator の配分パネル数と同じ単位（刻み×枚数で総メモリを表す）。
  // Stage に依存せず数値で受け、プレイ面・サンドボックス双方で使い回せるようにする。
  import IconPill from "#lib/presentation/components/atoms/IconPill.svelte";

  interface MemoryPillProps {
    memoryTotal: number;
    memoryGrain: number;
  }

  let { memoryTotal, memoryGrain }: MemoryPillProps = $props();

  // 枚数＝総メモリ/刻み（memoryTotal は memoryGrain の倍数という invariant 前提）。
  const chunkCount = $derived(memoryTotal / memoryGrain);
</script>

<IconPill icon="mdi:memory" label={`${memoryGrain}×${chunkCount}枚`} title="メモリ（刻み×枚数＝HP↔CP に配る原資）" />
