<script lang="ts">
  import { TabGroup, Tab } from "@skeletonlabs/skeleton";
  import { page } from "$app/stores";
  import type { SlotTabSetting } from "$lib/types/tabSetting";
  import { navigateTo } from "$lib/utils/navigation.client";

  export let data: {
    slotTabSettings: SlotTabSetting[];
  };
  const tabSettings = data.slotTabSettings;

  let currentTabIndex = 0;
  function updateCurrentTabIndex(path: string) {
    const relativePath = path.split("/").at(-1);
    const tabSetting = tabSettings.find((tab) => tab.path === relativePath);
    if (tabSetting) {
      currentTabIndex = tabSetting.index;
    }
  }
  $: updateCurrentTabIndex($page.url.pathname);

  function handleTabChange(index: number) {
    const tabSetting = tabSettings.find((tab) => tab.index === index);
    if (tabSetting) {
      currentTabIndex = index;
      navigateTo(`/books/basis/${tabSetting.path}`);
    }
  }
</script>

<div class="cRouteBodyStyle">
  <div class="w-11/12">
    <TabGroup bind:group={currentTabIndex}>
      {#each tabSettings as { index, label }}
        <Tab bind:group={currentTabIndex} name={label} value={index} on:click={() => handleTabChange(index)}>
          <span class="font-pixel10 {currentTabIndex === index ? 'font-bold' : ''}">{label}</span>
        </Tab>
      {/each}
      <svelte:fragment slot="panel">
        <div class="w-full">
          <slot />
        </div>
      </svelte:fragment>
    </TabGroup>
  </div>
</div>
