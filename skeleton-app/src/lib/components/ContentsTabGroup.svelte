<script lang="ts">
  import { TabGroup, Tab } from "@skeletonlabs/skeleton";
  import { page } from "$app/stores";
  import type { SlotTabSetting } from "$lib/types/tabSetting";
  import { navigateTo } from "$lib/utils/navigation.client";

  export let currentTabIndex: number;
  export let tabSettings: SlotTabSetting[];
  export let navigatePathPrefix: string;
  export let cContainer: string = "w-full";
  export let cPanel: string = "w-full";

  function updateCurrentTabIndex(path: string) {
    const splittedPath = path.split("/");
    const relativePaths = [splittedPath.at(-2), splittedPath.at(-1)];
    const tabSetting = tabSettings.find((tab) => relativePaths.includes(tab.path));
    if (tabSetting) {
      currentTabIndex = tabSetting.index;
    } else {
      currentTabIndex = 0;
    }
  }
  $: updateCurrentTabIndex($page.url.pathname);

  function handleTabChange(index: number) {
    const tabSetting = tabSettings.find((tab) => tab.index === index);
    if (tabSetting) {
      currentTabIndex = index;
      navigateTo(`${navigatePathPrefix}/${tabSetting.path}`);
    }
  }
</script>

<div class={cContainer}>
  <TabGroup bind:group={currentTabIndex}>
    {#each tabSettings as { index, label }}
      <Tab bind:group={currentTabIndex} name={label} value={index} on:click={() => handleTabChange(index)}>
        <span class="font-pixel10 {currentTabIndex === index ? 'font-bold' : ''}">{label}</span>
      </Tab>
    {/each}
    <svelte:fragment slot="panel">
      <div class={cPanel}>
        <slot />
      </div>
    </svelte:fragment>
  </TabGroup>
</div>
