<script lang="ts">
  import Icon from "@iconify/svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import type { SlotTabSetting } from "$lib/types/tabSetting";

  export let data: {
    slotTabSettings: SlotTabSetting[];
  };
  const tabSettings = data.slotTabSettings.filter((tab) => tab.index !== 0);

  let currentPath: string;
  $: currentPath = $page.url.pathname;
</script>

<div class="flex flex-col items-center justify-center text-lg">
  <span> プログラムの基礎 </span>
  <ul class="m-5 space-y-4">
    {#each tabSettings as { label, title, path }}
      <li class="hover:underline">
        <button on:click|preventDefault={() => goto(`${currentPath}/${path}`)} class="flex items-center">
          <Icon icon="mdi:script-text-outline" class="mx-2" />
          <span class="font-bold"> {label}: {title} </span>
        </button>
      </li>
    {/each}
  </ul>
</div>
