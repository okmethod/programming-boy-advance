<script lang="ts">
  import { getToastStore, type ToastSettings } from "@skeletonlabs/skeleton";
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
    let message: string;
    let succeed: boolean;
    try {
      safeEval(allowedGlobals, code);
      message = "Executed successfully.";
      succeed = true;
    } catch (error: unknown) {
      console.error("Failed to execute code:", error);
      message = error instanceof Error ? `${error.name}: ${error.message}` : "UnknownError";
      succeed = false;
    }
    toastStore.trigger(toastSettings(message, succeed));
  }

  // トースト表示
  const toastStore = getToastStore();
  function toastSettings(message: string, succeed: boolean): ToastSettings {
    const cBackground = succeed ? "bg-green-100" : "bg-red-100";
    return {
      message: message,
      background: `${cBackground} select-none`,
      timeout: 2000,
      autohide: succeed,
    };
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
