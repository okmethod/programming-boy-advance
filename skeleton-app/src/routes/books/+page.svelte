<script lang="ts">
  import type { ComponentType } from "svelte";
  import { TabGroup, Tab } from "@skeletonlabs/skeleton";
  import Book1 from "./Book1.svelte";
  import Book2 from "./Book2.svelte";
  import Book3 from "./Book3.svelte";
  import Book4 from "./Book4.svelte";
  import Book5 from "./Book5.svelte";
  import Book6 from "./Book6.svelte";
  import Book7 from "./Book7.svelte";

  interface TabSetting {
    index: number;
    name: string;
    label: string;
    component: ComponentType;
  }

  let currentTab = 1;
  const tabSettings: TabSetting[] = [
    { index: 1, name: "book1", label: "(Book 1)", component: Book1 },
    { index: 2, name: "book2", label: "(Book 2)", component: Book2 },
    { index: 3, name: "book3", label: "(Book 3)", component: Book3 },
    { index: 4, name: "book4", label: "(Book 4)", component: Book4 },
    { index: 5, name: "book5", label: "(Book 5)", component: Book5 },
    { index: 6, name: "book6", label: "(Book 6)", component: Book6 },
    { index: 7, name: "book7", label: "(Book 7)", component: Book7 },
  ];
</script>

<div class="cRouteBodyStyle">
  <!-- タイトル部 -->
  <div class="cTitlePartStyle md:!mb-4">
    <h1 class="cTitleStyle md:!text-3xl">PGM Books</h1>
  </div>

  <!-- コンテンツ部 -->
  <div class="w-full">
    <TabGroup>
      {#each tabSettings as { index, name, label }}
        <Tab bind:group={currentTab} {name} value={index}>
          <span class="font-pixel10 {currentTab === index ? 'font-bold' : ''}">{label}</span>
        </Tab>
      {/each}
      <svelte:fragment slot="panel">
        <div class="flex flex-row w-full justify-center items-center gap-4 m-4">
          {#each tabSettings as { index, component }}
            {#if currentTab === index}
              <svelte:component this={component} />
            {/if}
          {/each}
        </div>
      </svelte:fragment>
    </TabGroup>
  </div>
</div>
