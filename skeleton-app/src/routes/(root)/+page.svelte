<script lang="ts">
  import CursorButton from "$lib/components/CursorButton.svelte";
  import type { ContentButtonProps } from "./+page";

  export let data: {
    propsArray: Array<ContentButtonProps>;
  };
</script>

<div class="cRouteBodyStyle">
  <div class="cTitlePartStyle md:!mb-4">
    <h1 class="cTitleStyle md:!text-3xl">PGM Boy Advance</h1>
  </div>

  <div class="cContentPartStyle">
    <div class="flex flex-col items-start space-y-4">
      {#each data.propsArray as props}
        <CursorButton
          label={props.title}
          cButton="text-lg md:text-2xl"
          cCursor="!text-xs md:!text-sm"
          onClick={props.onClick}
        />
      {/each}
    </div>
  </div>
</div>
