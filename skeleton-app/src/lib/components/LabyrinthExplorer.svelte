<script lang="ts">
  import { getToastStore } from "@skeletonlabs/skeleton";
  import HighlightCodeEditor from "$lib/components/HighlightCodeEditor.svelte";
  import type { CodeExeProps } from "$lib/types/props";
  import { executeEval, type AllowedGlobals } from "$lib/utils/safeEval";
  import { simpleToast } from "$lib/utils/toastSettings";

  export let codeExeProps: CodeExeProps;

  type Cell = "00" | "01" | "10" | "11";
  // "00" -> {r:0, b:0}, "01" -> {r:0, b:1}, etc.

  // prettier-ignore
  const maze: Cell[][] = [
    ["10", "00", "01", "01", "00", "01", "00", "01", "01"],
    ["10", "01", "01", "11", "10", "10", "01", "10", "00"],
    ["10", "01", "01", "01", "10", "10", "10", "10", "00"],
    ["01", "01", "01", "01", "10", "10", "10", "10", "00"],
    ["00", "00", "01", "01", "10", "10", "10", "10", "00"],
    ["10", "01", "01", "10", "01", "01", "10", "10", "00"],
    ["10", "00", "11", "10", "00", "01", "01", "01", "01"],
    ["10", "00", "01", "11", "01", "01", "01", "01", "00"],
    ["10", "00", "00", "00", "00", "00", "00", "00", "00"],
  ];

  function parseCell(cell: string): { r: boolean; b: boolean } {
    return {
      r: parseInt(cell[0]) === 1,
      b: parseInt(cell[1]) === 1,
    };
  }
  const parsedMaze = maze.map((row) => row.map(parseCell));

  interface Position {
    row: number;
    col: number;
  }
  const startPos: Position = { row: maze.length - 1, col: 0 };
  const goalPos: Position = { row: 0, col: maze[0].length - 1 };
  let currentPos: Position = { row: maze.length - 1, col: 0 };

  const allowedGlobalsDefault: AllowedGlobals = {
    log: log,
    up: up,
    Math: Math,
    // console: console,
    // 必要に応じて追加
  };

  const toastStore = getToastStore();

  export function up(): void {
    if (currentPos.row > 0 && !parsedMaze[currentPos.row - 1][currentPos.col].b) {
      currentPos = { row: currentPos.row - 1, col: currentPos.col };
    } else {
      log("(): Can't move up.");
    }
    turnCounter++;
  }

  export function log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const log = `[${timestamp}] ${message}`;
    codeExeProps.logs = [...codeExeProps.logs, log];
    scrollToBottom();
  }

  let turnCounter = 0;
  function handleExecute(): void {
    const result = executeEval(codeExeProps.code, {
      ...allowedGlobalsDefault,
      ...codeExeProps.allowedGlobals,
    });
    toastStore.trigger(simpleToast(result.message, result.status));
    if (result.resultString !== null) codeExeProps.resultString = result.resultString;
  }

  let logContainer: HTMLDivElement;
  function scrollToBottom() {
    if (logContainer) {
      logContainer.scrollTo({ top: logContainer.scrollHeight, behavior: "smooth" });
    }
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
          {#each parsedMaze as row, rowIndex}
            <div class="flex">
              {#each row as cell, colIndex}
                <div
                  class="relative w-10 h-10 bg-gray-200 box-border border border-gray-300"
                  class:border-r-2={cell.r}
                  class:border-r-black={cell.r}
                  class:border-b-2={cell.b}
                  class:border-b-black={cell.b}
                >
                  {#if startPos.row === rowIndex && startPos.col === colIndex}
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-blue-500">S</span>
                    </div>
                  {/if}
                  {#if goalPos.row === rowIndex && goalPos.col === colIndex}
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-blue-500">G</span>
                    </div>
                  {/if}
                  {#if currentPos.row === rowIndex && currentPos.col === colIndex}
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-blue-500 text-xl">◯</span>
                    </div>
                  {/if}
                </div>
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
        <div
          bind:this={logContainer}
          class="w-96 h-40 p-4 border border-gray-500 bg-gray-100 rounded-md space-y-1 overflow-y-auto"
        >
          {#each codeExeProps.logs as log}
            <span class="block border border-gray-200 rounded-sm font-pixel10">{log}</span>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>
