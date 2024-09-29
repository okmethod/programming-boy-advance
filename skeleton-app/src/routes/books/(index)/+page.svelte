<script lang="ts">
  import Icon from "@iconify/svelte";
  import type { SlotTabSetting } from "$lib/types/tabSetting";
  import { navigateTo } from "$lib/utils/navigation.client";

  export let data: {
    slotTabSettings: SlotTabSetting[];
  };
  const tabSettings = data.slotTabSettings;
</script>

<div class="flex flex-col items-center justify-center text-lg">
  <span> プログラミングを学びましょう！ </span>
  <ul class="m-5 space-y-4">
    {#each tabSettings as { label, title, path }}
      <li class="hover:underline">
        <button on:click|preventDefault={() => navigateTo(`/books/${path}`)} class="flex items-center">
          <Icon icon="mdi:book-open-variant-outline" class="mx-2" />
          <span class="font-bold"> {label}: {title} </span>
        </button>
      </li>
    {/each}
  </ul>
</div>
