<script lang="ts">
  import { getToastStore } from "@skeletonlabs/skeleton";
  import HighlightCodeEditor from "$lib/components/HighlightCodeEditor.svelte";
  import type { CodeExeProps } from "$lib/types/props";
  import { executeEval, type AllowedGlobals } from "$lib/utils/safeEval";
  import { simpleToast } from "$lib/utils/toastSettings";

  export let codeExeProps: CodeExeProps;
  export let allowedGlobals: AllowedGlobals;

  const allowedGlobalsDefault: AllowedGlobals = {
    log: log,
    Math: Math,
    Date: Date,
    // console: console,
    // 必要に応じて追加
  };

  const toastStore = getToastStore();

  export function log(message: string): void {
    const timestamp = new Date().toLocaleString();
    codeExeProps.logs.push(`[${timestamp}] ${message}`);
    codeExeProps.logs = [...codeExeProps.logs];
  }

  function handleExecute(): void {
    const result = executeEval(codeExeProps.code, { ...allowedGlobalsDefault, ...allowedGlobals });
    toastStore.trigger(simpleToast(result.message, result.status));
    if (result.resultString !== null) codeExeProps.resultString = result.resultString;
  }

  function clearCode(): void {
    codeExeProps.code = "";
  }
  function clearResult(): void {
    codeExeProps.resultString = "";
  }
  function clearLogs(): void {
    codeExeProps.logs = [];
  }
</script>

<div class="col-span-1 lg:col-span-5">
  <div class="flex justify-between ml-2">
    <strong class="cIndexSpan">Code Editor</strong>
    <button type="submit" on:click={clearCode} class="relative z-30"> ✕ </button>
  </div>
  <HighlightCodeEditor bind:code={codeExeProps.code} cLanguage="language-javascript" />
</div>

<div class="col-span-1 lg:col-span-2 flex justify-center items-center">
  <button type="submit" on:click={handleExecute} class="cIconButtonStyle relative">
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
      <span class="block font-pixel12">{codeExeProps.resultString ?? ""}</span>
    </div>
  </div>
  <div>
    <div class="flex justify-between ml-2">
      <strong class="cIndexSpan">Logs</strong>
      <button type="submit" on:click={clearLogs} class="relative z-30"> ✕ </button>
    </div>
    <div class="w-96 h-40 p-4 border border-gray-300 rounded-md space-y-1 overflow-y-auto">
      {#each codeExeProps.logs as log}
        <span class="block border border-gray-100 rounded-sm font-pixel10">{log}</span>
      {/each}
    </div>
  </div>
</div>
