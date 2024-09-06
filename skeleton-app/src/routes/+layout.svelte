<script lang="ts">
  import "../app.postcss";
  import { AppBar } from "@skeletonlabs/skeleton";
  import { Toast, Modal, initializeStores } from "@skeletonlabs/skeleton";
  initializeStores();

  // Highlight JS
  import hljs from "highlight.js/lib/core";
  import "highlight.js/styles/github-dark.css";
  import { storeHighlightJs } from "@skeletonlabs/skeleton";
  import xml from "highlight.js/lib/languages/xml"; // for HTML
  import css from "highlight.js/lib/languages/css";
  import javascript from "highlight.js/lib/languages/javascript";
  import typescript from "highlight.js/lib/languages/typescript";
  hljs.registerLanguage("xml", xml); // for HTML
  hljs.registerLanguage("css", css);
  hljs.registerLanguage("javascript", javascript);
  hljs.registerLanguage("typescript", typescript);
  storeHighlightJs.set(hljs);

  // Floating UI for Popups
  import { computePosition, autoUpdate, flip, shift, offset, arrow } from "@floating-ui/dom";
  import { storePopup } from "@skeletonlabs/skeleton";
  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

  import { navigateTo } from "$lib/utils/navigation.client";
</script>

<svelte:head>
  <title>My Static WebSite</title>
</svelte:head>

<Modal />
<Toast position="tr" rounded="rounded-lg" />

<div class="flex flex-col h-screen">
  <div class="border-b border-gray-400">
    <AppBar class="!p-1 md:!p-2">
      <div class="flex items-center h-full">
        <a href="/" class="flex items-center" on:click|preventDefault={() => navigateTo("/")}>
          <div class="text-sm md:text-lg">TOP</div>
        </a>
      </div>
    </AppBar>
  </div>

  <div class="container mx-auto overflow-y-auto pb-16">
    <slot />
  </div>
</div>
