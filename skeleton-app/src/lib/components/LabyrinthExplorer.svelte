<script lang="ts">
  import { getToastStore } from "@skeletonlabs/skeleton";
  import HighlightCodeEditor from "$lib/components/HighlightCodeEditor.svelte";
  import type { CodeExeProps } from "$lib/types/props";
  import { executeEval, type AllowedGlobals } from "$lib/utils/safeEval";
  import { simpleToast } from "$lib/utils/toastSettings";

  export let codeExeProps: CodeExeProps;
  export let allowedGlobals: AllowedGlobals;

  type Cell = {
    r: 0 | 1; // right wall: 0 -> false, 1 -> true
    b: 0 | 1; // bottom wall: 0 -> false, 1 -> true
  };

  // prettier-ignore
  const maze: Cell[][] = [
    [{r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:0,b:1}],
    [{r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:0,b:0}],
    [{r:1,b:0}, {r:0,b:1}, {r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:0,b:1}],
    [{r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:0,b:0}],
    [{r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:0,b:1}],
    [{r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:0,b:0}],
    [{r:1,b:0}, {r:0,b:1}, {r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:0,b:1}],
    [{r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:1,b:0}, {r:1,b:1}, {r:0,b:0}],
  ];

  const allowedGlobalsDefault: AllowedGlobals = {
    log: log,
    Math: Math,
    // console: console,
    // 必要に応じて追加
  };

  const toastStore = getToastStore();

  export function log(message: string): void {
    const timestamp = new Date().toLocaleString();
    codeExeProps.logs.push(`[${timestamp}] ${message}`);
    codeExeProps.logs = [...codeExeProps.logs];
  }

  let turnCounter = 0;
  function handleExecute(): void {
    const result = executeEval(codeExeProps.code, { ...allowedGlobalsDefault, ...allowedGlobals });
    toastStore.trigger(simpleToast(result.message, result.status));
    if (result.resultString !== null) codeExeProps.resultString = result.resultString;
  }

  function clearCode(): void {
    codeExeProps.code = "";
  }
  function clearLogs(): void {
    codeExeProps.logs = [];
  }
</script>

<div class="grid grid-cols-1 lg:grid-cols-3 justify-center items-top gap-4 m-4">
  <div class="col-span-1">
    <div class="flex flex-col justify-center items-center">
      <div>
        <div class="flex justify-between ml-2">
          <strong class="cIndexSpan">Maze</strong>
        </div>
        <div class="bg-gray-400 border border-gray-500 p-4">
          {#each maze as row}
            <div class="flex">
              {#each row as cell}
                <div
                  class="w-10 h-10 bg-gray-200 box-border border border-gray-300"
                  class:border-r-2={cell.r}
                  class:border-r-black={cell.r}
                  class:border-b-2={cell.b}
                  class:border-b-black={cell.b}
                ></div>
              {/each}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <div class="col-span-1">
    <div class="flex flex-col justify-center items-center space-y-1">
      <div>
        <div class="flex justify-between ml-2">
          <strong class="cIndexSpan">Code Editor</strong>
          <button type="submit" on:click={clearCode} class="relative z-30"> ✕ </button>
        </div>
        <HighlightCodeEditor bind:code={codeExeProps.code} cLanguage="language-javascript" />
      </div>

      <div class="pt-2">
        <button type="submit" on:click={handleExecute} class="cIconButtonStyle relative">
          <div class="cButtonSpan">
            <span> Execute </span>
          </div>
        </button>
      </div>
    </div>
  </div>

  <div class="col-span-1">
    <div class="flex flex-col justify-cetnter items-center space-y-1">
      <div>
        <div class="flex justify-between ml-2 space-x-1">
          <strong>Turns: </strong>
          <span>{turnCounter}</span>
        </div>
      </div>
      <div>
        <div class="flex justify-between ml-2">
          <strong class="cIndexSpan">Logs</strong>
          <button type="submit" on:click={clearLogs} class="relative z-30"> ✕ </button>
        </div>
        <div class="w-96 h-40 p-4 border border-gray-500 bg-gray-100 rounded-md space-y-1 overflow-y-auto">
          {#each codeExeProps.logs as log}
            <span class="block border border-gray-200 rounded-sm font-pixel10">{log}</span>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>
