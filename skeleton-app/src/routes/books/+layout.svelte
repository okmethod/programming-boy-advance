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
      navigateTo(`/books/${tabSetting.path}`);
    }
  }
</script>

<div class="cRouteBodyStyle">
  <!-- タイトル部 -->
  <div class="cTitlePartStyle">
    <h1 class="cTitleStyle md:!text-3xl">PGM Books</h1>
  </div>

  <!-- コンテンツ部 -->
  <div class="w-full">
    <TabGroup bind:group={currentTabIndex}>
      {#each tabSettings as { index, label, path }}
        <Tab group={currentTabIndex} name={path} value={index} on:click={() => handleTabChange(index)}>
          <span class="font-pixel10 {currentTabIndex === index ? 'font-bold' : ''}">{label}</span>
        </Tab>
      {/each}
      <svelte:fragment slot="panel">
        <div class="max-h-[calc(100vh-12rem)] overflow-y-auto">
          <slot />
        </div>
      </svelte:fragment>
    </TabGroup>
  </div>
</div>
