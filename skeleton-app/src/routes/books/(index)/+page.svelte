<script lang="ts">
  import Icon from "@iconify/svelte";
  import { navigateTo } from "$lib/utils/navigation.client";
</script>

<div class="flex flex-col items-center justify-center text-lg">
  <span> プログラミングを学びましょう！ </span>
  <ul class="m-5 space-y-4">
    <li class="hover:underline">
      <button on:click|preventDefault={() => navigateTo("/books/cheat")} class="flex items-center">
        <Icon icon="mdi:book-open-variant-outline" class="mx-2" />
        <span class="font-bold"> Book 1: チートシート </span>
      </button>
    </li>
    <li class="hover:underline">
      <button on:click|preventDefault={() => navigateTo("/books/basis")} class="flex items-center">
        <Icon icon="mdi:book-open-variant-outline" class="mx-2" />
        <span class="font-bold"> Book 2: プログラムの基礎 </span>
      </button>
    </li>
  </ul>
</div>
