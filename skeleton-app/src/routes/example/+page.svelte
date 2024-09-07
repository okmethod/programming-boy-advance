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

return 'This is Return Value.';

`;

  let logs: string[] = [];
  function customFunction() {
    const timestamp = new Date().toLocaleString();
    logs.push(`[${timestamp}] Custom function called.`);
    logs = [...logs];
  }

  const allowedGlobals: AllowedGlobals = {
    customFunction: customFunction,
    // console: console,
    // 必要に応じて追加
  };

  let code = sampleCode;
  let resultString: string;
  function executeCode(): void {
    let message: string;
    let succeed: boolean;
    try {
      const result = safeEval(allowedGlobals, code);
      if (typeof result === "string" || typeof result === "number" || typeof result === "boolean") {
        resultString = String(result);
      }
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
    <h1 class="cTitleStyle md:!text-3xl">Code Executer</h1>
  </div>

  <!-- コンテンツ部 -->
  <div class="cContentPartStyle !m-4">
    <HighlightCodeEditor bind:code cLanguage="language-javascript" />
    <button type="submit" on:click={executeCode} class="cIconButtonStyle">
      <div class="cButtonSpan">
        <span> Execute </span>
      </div>
    </button>
    <div class="w-96 h-40 p-4 border border-gray-300 rounded-md overflow-y-auto">
      <span class="block font-mono">{resultString ?? ""}</span>
    </div>
    <div class="w-96 h-40 p-4 border border-gray-300 rounded-md overflow-y-auto">
      {#each logs as log}
        <span class="block font-mono">{log}</span>
      {/each}
    </div>
  </div>
</div>
