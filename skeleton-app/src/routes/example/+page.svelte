<script lang="ts">
  import { onMount } from "svelte";
  import { storeHighlightJs } from "@skeletonlabs/skeleton";
  import { get } from "svelte/store";

  const hljs = get(storeHighlightJs);
  function highlightCode() {
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightBlock(block);
    });
  }

  const sampleCode = `
function helloWorld() {
  console.log('Hello, world!');
}

`;

  onMount(() => {
    highlightCode();
  });
</script>

<div class="cRouteBodyStyle">
  <!-- タイトル部 -->
  <div class="cTitlePartStyle md:!mb-4">
    <h1 class="cTitleStyle md:!text-3xl">Example route</h1>
  </div>

  <!-- コンテンツ部 -->
  <div class="cContentPartStyle !m-4">
    <!-- コードブロック -->
    <pre>
      <code class="language-javascript">{sampleCode}</code>
    </pre>
  </div>
</div>
