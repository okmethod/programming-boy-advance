<script lang="ts">
  import type { Snippet } from "svelte";
  import type { SlotTabSetting } from "$lib/types/tabSetting";
  import ContentsTabGroup from "$lib/components/ContentsTabGroup.svelte";

  let { data, children }: { data: { slotTabSettings: SlotTabSetting[] }; children: Snippet } = $props();
  const tabSettings = $derived(data.slotTabSettings);

  let currentTabIndex = $state(0);
</script>

<div class="cRouteBodyStyle">
  <!-- タイトル部 -->
  <div class="cTitlePartStyle">
    <h1 class="cTitleStyle md:!text-3xl">迷路ゲーム</h1>
  </div>

  <!-- コンテンツ部 -->
  <ContentsTabGroup
    bind:currentTabIndex
    {tabSettings}
    navigatePathPrefix="/labyrinth"
    cContainer="w-full"
    cPanel="max-h-[calc(100vh-12rem)] overflow-y-auto"
  >
    {@render children()}
  </ContentsTabGroup>
</div>
