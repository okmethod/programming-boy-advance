<script lang="ts">
  import { page } from "$app/stores";
  import type { SlotTabSetting } from "$lib/types/tabSetting";
  import ContentsIndex from "$lib/components/ContentsIndex.svelte";

  export let data: {
    slotTabSettings: SlotTabSetting[];
  };
  const tabSettings = data.slotTabSettings.filter((tab) => tab.index !== 0);

  let currentPath: string;
  $: currentPath = $page.url.pathname;
</script>

<ContentsIndex
  title="プログラミングを学びましょう！"
  icon="mdi:book-open-variant-outline"
  {tabSettings}
  {currentPath}
/>
