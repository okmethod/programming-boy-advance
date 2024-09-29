<script lang="ts">
  import type { SlotTabSetting } from "$lib/types/tabSetting";
  import ContentsTabGroup from "$lib/components/ContentsTabGroup.svelte";

  export let data: {
    slotTabSettings: SlotTabSetting[];
  };
  const tabSettings = data.slotTabSettings;

  let currentTabIndex = 0;
</script>

<div class="cRouteBodyStyle">
  <ContentsTabGroup
    bind:currentTabIndex
    {tabSettings}
    navigatePathPrefix="/books/pgm-basis"
    cContainer="w-11/12"
    cPanel="w-full"
  >
    <slot />
  </ContentsTabGroup>
</div>
