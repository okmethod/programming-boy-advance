<script lang="ts">
  import HighlightCodeEditor from "$lib/components/HighlightCodeEditor.svelte";

  const sampleCode = `
function helloWorld() {
  console.log('Hello, world!');
}

`;

  let code = sampleCode;
</script>

<div class="cRouteBodyStyle">
  <!-- タイトル部 -->
  <div class="cTitlePartStyle md:!mb-4">
    <h1 class="cTitleStyle md:!text-3xl">Highlight Code Editor</h1>
  </div>

  <!-- コンテンツ部 -->
  <div class="cContentPartStyle !m-4">
    <HighlightCodeEditor bind:code cLanguage="language-javascript" />
  </div>
</div>
