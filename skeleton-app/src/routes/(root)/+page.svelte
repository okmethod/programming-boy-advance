<script lang="ts">
  import type { ContentButtonProps } from "./+page";

  export let data: {
    propsArray: Array<ContentButtonProps>;
  };
</script>

<div class="cRouteBodyStyle">
  <!-- タイトル部 -->
  <div class="cTitlePartStyle md:!mb-4">
    <h1 class="cTitleStyle md:!text-3xl">Welcome to My Static Site !</h1>
  </div>

  <!-- コンテンツ部 -->
  <div class="cContentPartStyle !m-4">
    {#each data.propsArray as props}
      <div class="">
        <button on:click|preventDefault={props.onClick} class="flex items-center">
          <span class="cLinkButtonStyle md:!text-2xl">{props.title}</span>
        </button>
      </div>
    {/each}
  </div>
</div>
