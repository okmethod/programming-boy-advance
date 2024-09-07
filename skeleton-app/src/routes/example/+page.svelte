<script lang="ts">
  import HighlightCodeEditor from "$lib/components/HighlightCodeEditor.svelte";
  import { safeEval, type AllowedGlobals } from "$lib/utils/safeEval";

  const sampleCode = `
function helloWorld() {
  console.log('Hello, world!');
}

// helloWorld();
customFunction();

`;

  function customFunction() {
    console.log("Custom function called.");
  }

  const allowedGlobals: AllowedGlobals = {
    customFunction: customFunction,
    // console: console,
    // 必要に応じて追加
  };

  let code = sampleCode;
  function executeCode(): void {
    try {
      safeEval(allowedGlobals, code);
      console.log("Executed successfully.");
    } catch (error) {
      console.error("Failed to execute code:", error);
    }
  }
</script>

<div class="cRouteBodyStyle">
  <!-- タイトル部 -->
  <div class="cTitlePartStyle md:!mb-4">
    <h1 class="cTitleStyle md:!text-3xl">Highlight Code Editor</h1>
  </div>

  <!-- コンテンツ部 -->
  <div class="cContentPartStyle !m-4">
    <HighlightCodeEditor bind:code cLanguage="language-javascript" />
    <button type="submit" on:click={executeCode} class="cIconButtonStyle">
      <div class="cButtonSpan">
        <span> Execute </span>
      </div>
    </button>
  </div>
</div>
