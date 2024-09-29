<script lang="ts">
  import Icon from "@iconify/svelte";
  import { goto } from "$app/navigation";

  export let title: string;
  export let icon: string;
  export let tabSettings: { label: string; title: string; path: string }[];
  export let currentPath: string;
</script>

<div class="cBookContents">
  <h2 class="cLessonTitle">{title}</h2>
  <hr class="cBorderLine" />
  <ul class="space-y-4 text-lg">
    {#each tabSettings as { label, title, path }}
      <li class="hover:underline">
        <button on:click|preventDefault={() => goto(`${currentPath}/${path}`)} class="flex items-center">
          <Icon {icon} class="mx-2" />
          <span class="font-bold"> {label}: {title} </span>
        </button>
      </li>
    {/each}
  </ul>
</div>
