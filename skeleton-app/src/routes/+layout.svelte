<script lang="ts">
  import "../app.css";
  import type { Snippet } from "svelte";
  import { Portal, Toast } from "@skeletonlabs/skeleton-svelte";
  import Icon from "@iconify/svelte";
  import { resolve } from "$app/paths";
  import { toaster } from "$lib/utils/toaster";
  import { navigateTo } from "$lib/utils/navigation.client";

  let { children }: { children: Snippet } = $props();

  function handleTop(event: MouseEvent): void {
    event.preventDefault();
    navigateTo("/");
  }
</script>

<svelte:head>
  <title>PGM Boy Advance</title>
</svelte:head>

<Portal>
  <Toast.Group {toaster} class="fixed top-4 right-4 z-50 flex flex-col gap-2">
    {#snippet children(toast)}
      <Toast {toast} class="card w-64 rounded-lg p-4 shadow-lg md:w-96">
        <div class="flex w-full items-center gap-2">
          <Toast.Title class="flex-1">{toast.title}</Toast.Title>
          <Toast.CloseTrigger class="btn-icon btn-icon-sm preset-tonal ml-auto shrink-0">
            <Icon icon="mdi:close" class="size-4" />
          </Toast.CloseTrigger>
        </div>
      </Toast>
    {/snippet}
  </Toast.Group>
</Portal>

<div class="h-screen flex flex-col">
  <div class="border-b border-gray-400">
    <!-- Skeleton v5 で AppBar は Svelte コンポーネントではなくなったため、素の要素で代替する -->
    <div class="p-1 md:p-2 flex items-center">
      <a href={resolve("")} class="flex items-center" onclick={handleTop}>
        <div class="text-sm md:text-lg hover:underline">TOP</div>
      </a>
    </div>
  </div>

  <div class="w-screen mx-auto overflow-y-auto scrollbar-gutter-stable pb-2">
    {@render children()}
  </div>
</div>
