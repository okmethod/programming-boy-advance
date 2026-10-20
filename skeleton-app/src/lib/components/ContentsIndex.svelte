<script lang="ts">
  import Icon from "@iconify/svelte";
  import { goto } from "$app/navigation";

  interface ContentsIndexProps {
    title: string;
    icon: string;
    tabSettings: { label: string; title: string; path: string }[];
    currentPath: string;
  }

  let { title, icon, tabSettings, currentPath }: ContentsIndexProps = $props();
</script>

<div class="cBookContents">
  <h2 class="cLessonTitle">{title}</h2>
  <hr class="cBorderLine" />
  <ul class="space-y-4 text-lg">
    {#each tabSettings as { label, title, path } (path)}
      <li class="hover:underline">
        <button
          onclick={(e) => {
            e.preventDefault();
            // currentPath は page.url.pathname（base を含む解決済み絶対パス）のため resolve は不要
            // eslint-disable-next-line svelte/no-navigation-without-resolve
            goto(`${currentPath}/${path}`);
          }}
          class="flex items-center"
        >
          <Icon {icon} class="mx-2" />
          <span class="font-bold"> {label}: {title} </span>
        </button>
      </li>
    {/each}
  </ul>
</div>
