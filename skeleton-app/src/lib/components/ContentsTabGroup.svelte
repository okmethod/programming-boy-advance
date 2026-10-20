<script lang="ts">
  import type { Snippet } from "svelte";
  import { Tabs } from "@skeletonlabs/skeleton-svelte";
  import { page } from "$app/state";
  import type { SlotTabSetting } from "$lib/types/tabSetting";
  import { navigateTo } from "$lib/utils/navigation.client";

  interface ContentsTabGroupProps {
    currentTabIndex: number;
    tabSettings: SlotTabSetting[];
    navigatePathPrefix: string;
    cContainer?: string;
    cPanel?: string;
    children?: Snippet;
  }

  let {
    currentTabIndex = $bindable(0),
    tabSettings,
    navigatePathPrefix,
    cContainer = "w-full",
    cPanel = "w-full",
    children,
  }: ContentsTabGroupProps = $props();

  // URL から現在のタブ index を特定する
  function resolveTabIndex(path: string): number {
    const splittedPath = path.split("/");
    const relativePaths = [splittedPath.at(-2), splittedPath.at(-1)];
    const tabSetting = tabSettings.find((tab) => relativePaths.includes(tab.path));
    return tabSetting ? tabSetting.index : 0;
  }

  // URL 変化に追従して現在タブを同期する
  $effect(() => {
    currentTabIndex = resolveTabIndex(page.url.pathname);
  });

  function handleTabChange(index: number): void {
    const tabSetting = tabSettings.find((tab) => tab.index === index);
    if (tabSetting) {
      currentTabIndex = index;
      navigateTo(`${navigatePathPrefix}/${tabSetting.path}`);
    }
  }
</script>

<div class={cContainer}>
  <Tabs value={String(currentTabIndex)} onValueChange={(e) => handleTabChange(Number(e.value))}>
    <Tabs.List>
      {#each tabSettings as { index, label } (index)}
        <Tabs.Trigger value={String(index)}>
          <span class="font-pixel10 {currentTabIndex === index ? 'font-bold' : ''}">{label}</span>
        </Tabs.Trigger>
      {/each}
    </Tabs.List>
    <Tabs.Content value={String(currentTabIndex)}>
      <div class={cPanel}>
        {@render children?.()}
      </div>
    </Tabs.Content>
  </Tabs>
</div>
