<script lang="ts">
  import type { Snippet } from "svelte";
  import type { SlotTabSetting } from "$lib/types/tabSetting";
  import ContentsTabGroup from "$lib/components/ContentsTabGroup.svelte";

  let { data, children }: { data: { slotTabSettings: SlotTabSetting[] }; children: Snippet } = $props();
  const tabSettings = $derived(data.slotTabSettings);

  let currentTabIndex = $state(0);
</script>

<div class="cRouteBodyStyle">
  <ContentsTabGroup
    bind:currentTabIndex
    {tabSettings}
    navigatePathPrefix="/books/cheat-sheet"
    cContainer="w-11/12"
    cPanel="w-full"
  >
    {@render children()}
  </ContentsTabGroup>
</div>
