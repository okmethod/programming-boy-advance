<script lang="ts">
  import { TabGroup, Tab } from "@skeletonlabs/skeleton";
  import type { ComponentTabSetting } from "$lib/types/tabSetting";

  export let data: {
    componentTabSettings: ComponentTabSetting[];
  };
  const tabSettings = data.componentTabSettings;

  let currentTab = 1;
</script>

<div class="cRouteBodyStyle">
  <div class="flex justefy-center w-11/12">
    <TabGroup>
      {#each tabSettings as { index, label }}
        <Tab bind:group={currentTab} name={label} value={index}>
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
