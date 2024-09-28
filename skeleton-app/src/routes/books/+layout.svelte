<script lang="ts">
  import { onMount } from "svelte";
  import { TabGroup, Tab } from "@skeletonlabs/skeleton";
  import { page } from "$app/stores";
  import { base } from "$app/paths";
  import { navigateTo } from "$lib/utils/navigation.client";

  interface TabSetting {
    index: number;
    label: string;
    path: string;
  }

  const tabSettings: TabSetting[] = [
    { index: 0, label: "(Index)", path: "" },
    { index: 1, label: "(Book 1)", path: "cheat" },
    { index: 2, label: "(Book 2)", path: "basis" },
  ];

  let currentTabIndex = 0;
  function updateCurrentTabIndex(path: string) {
    const relativePath = path.slice(base.length + "/books/".length);
    const tabSetting = tabSettings.find((tab) => tab.path === relativePath);
    if (tabSetting) {
      currentTabIndex = tabSetting.index;
    }
  }

  onMount(() => {
    const unsubscribe = page.subscribe(($page) => {
      updateCurrentTabIndex($page.url.pathname);
    });
    return () => unsubscribe();
  });

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
