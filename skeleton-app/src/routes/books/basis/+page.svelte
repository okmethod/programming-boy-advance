<script lang="ts">
  import type { ComponentType } from "svelte";
  import { TabGroup, Tab } from "@skeletonlabs/skeleton";
  import Lesson1 from "./Lesson1.svelte";
  import Lesson2 from "./Lesson2.svelte";
  import Lesson3 from "./Lesson3.svelte";
  import Lesson4 from "./Lesson4.svelte";
  import Lesson5 from "./Lesson5.svelte";
  import Lesson6 from "./Lesson6.svelte";
  import Lesson7 from "./Lesson7.svelte";

  interface TabSetting {
    index: number;
    name: string;
    label: string;
    component: ComponentType;
  }

  let currentTab = 1;
  const tabSettings: TabSetting[] = [
    { index: 1, name: "lesson1", label: "(Lesson 1)", component: Lesson1 },
    { index: 2, name: "lesson2", label: "(Lesson 2)", component: Lesson2 },
    { index: 3, name: "lesson3", label: "(Lesson 3)", component: Lesson3 },
    { index: 4, name: "lesson4", label: "(Lesson 4)", component: Lesson4 },
    { index: 5, name: "lesson5", label: "(Lesson 5)", component: Lesson5 },
    { index: 6, name: "lesson6", label: "(Lesson 6)", component: Lesson6 },
    { index: 7, name: "lesson7", label: "(Lesson 7)", component: Lesson7 },
  ];
</script>

<div class="cRouteBodyStyle">
  <div class="flex justefy-center w-11/12">
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
