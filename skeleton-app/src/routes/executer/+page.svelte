<script lang="ts">
  import { getToastStore, type ToastSettings } from "@skeletonlabs/skeleton";
  import HighlightCodeEditor from "$lib/components/HighlightCodeEditor.svelte";
  import { safeEval, type AllowedGlobals } from "$lib/utils/safeEval";

  const sampleCode = `
const oddNumbers = [];
for (let i = 1; i <= 10; i++) {
  if (i % 2 !== 0) {
    log(i + " is Odd.");
    oddNumbers.push(i);
  } else {
    log(i + " is Even.");
  }
}
return oddNumbers;
`;

  let logs: string[] = [];
  function log(message: string): void {
    const timestamp = new Date().toLocaleString();
    logs.push(`[${timestamp}] ${message}`);
    logs = [...logs];
  }

  function customFunction(): void {
    log("Custom function called.");
  }

  const allowedGlobals: AllowedGlobals = {
    log: log,
    customFunction: customFunction,
    Math: Math,
    Date: Date,
    // console: console,
    // 必要に応じて追加
  };

  let code = sampleCode;
  let resultString: string;
  function executeCode(): void {
    let message: string;
    let succeed: boolean;
    if (!code) {
      message = "Code is empty.";
      succeed = true;
    } else {
      try {
        const result = safeEval(allowedGlobals, code);
        if (typeof result === "string" || typeof result === "number" || typeof result === "boolean") {
          resultString = String(result);
        } else if (Array.isArray(result) || typeof result === "object") {
          resultString = JSON.stringify(result, null, 2);
        }
        message = "Executed successfully.";
        succeed = true;
      } catch (error: unknown) {
        console.error("Failed to execute code:", error);
        message = error instanceof Error ? `${error.name}: ${error.message}` : "UnknownError";
        succeed = false;
      }
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

  function clearCode(): void {
    code = "";
  }
  function clearResult(): void {
    resultString = "";
  }
  function clearLogs(): void {
    logs = [];
  }
</script>

<div class="cRouteBodyStyle">
  <!-- タイトル部 -->
  <div class="cTitlePartStyle md:!mb-4">
    <h1 class="cTitleStyle md:!text-3xl">Test Code Executer</h1>
  </div>

  <!-- コンテンツ部 -->
  <div class="grid grid-cols-1 lg:grid-cols-12 justify-center items-center gap-4 m-4">
    <div class="col-span-1 lg:col-span-5">
      <div class="flex justify-between ml-2">
        <strong class="cIndexSpan">Code Editor</strong>
        <button type="submit" on:click={clearCode} class="relative z-30"> ✕ </button>
      </div>
      <HighlightCodeEditor bind:code cLanguage="language-javascript" />
    </div>

    <div class="col-span-1 lg:col-span-2 flex justify-center items-center">
      <button type="submit" on:click={executeCode} class="cIconButtonStyle relative">
        <div class="cButtonSpan">
          <span> Execute </span>
        </div>
      </button>
    </div>

    <div class="col-span-1 lg:col-span-5 space-y-4">
      <div>
        <div class="flex justify-between ml-2">
          <strong class="cIndexSpan">Result</strong>
          <button type="submit" on:click={clearResult} class="relative z-30"> ✕ </button>
        </div>
        <div class="w-96 h-24 p-4 border border-gray-300 rounded-md overflow-y-auto">
          <span class="block font-pixel12">{resultString ?? ""}</span>
        </div>
      </div>
      <div>
        <div class="flex justify-between ml-2">
          <strong class="cIndexSpan">Logs</strong>
          <button type="submit" on:click={clearLogs} class="relative z-30"> ✕ </button>
        </div>
        <div class="w-96 h-40 p-4 border border-gray-300 rounded-md space-y-1 overflow-y-auto">
          {#each logs as log}
            <span class="block border border-gray-100 rounded-sm font-pixel10">{log}</span>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>
