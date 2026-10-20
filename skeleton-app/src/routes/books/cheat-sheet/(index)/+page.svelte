<script lang="ts">
  import { page } from "$app/state";
  import type { SlotTabSetting } from "$lib/types/tabSetting";
  import ContentsIndex from "$lib/components/ContentsIndex.svelte";

  let { data }: { data: { slotTabSettings: SlotTabSetting[] } } = $props();
  const tabSettings = $derived(data.slotTabSettings.filter((tab) => tab.index !== 0));

  const currentPath = $derived(page.url.pathname);
</script>

<ContentsIndex title="チートシート" icon="mdi:script-text-outline" {tabSettings} {currentPath} />
