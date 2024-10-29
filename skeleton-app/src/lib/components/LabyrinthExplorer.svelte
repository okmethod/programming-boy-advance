<script lang="ts">
  import { getToastStore } from "@skeletonlabs/skeleton";
  import HighlightCodeEditor from "$lib/components/HighlightCodeEditor.svelte";
  import type { CodeExeProps } from "$lib/types/props";
  import type { LabyrinthSetting } from "$lib/types/labyrinthSetting";
  import { Direction, directionStringMap } from "$lib/types/labyrinthSetting";
  import { simpleToast } from "$lib/utils/toastSettings";
  import type { AllowedGlobals, WorkerResult } from "$lib/utils/WebWorkerClient";
  import WebWorkerClient from "$lib/utils/WebWorkerClient";

  const workerClient = new WebWorkerClient(60);

  export let codeExeProps: CodeExeProps;
  export let labyrinthSetting: LabyrinthSetting;

  function parseCell(cell: string): { r: boolean; b: boolean } {
    return {
      r: parseInt(cell[0]) === 1,
      b: parseInt(cell[1]) === 1,
    };
  }
  const parsedMazeMatrix = labyrinthSetting.mazeMatrix.map((row) => row.map(parseCell));
  let currentPos = labyrinthSetting.startPos;
  let currentDirection = labyrinthSetting.initialDirection;

  let turnCounter = 0;

  const labyrinthGlobals: AllowedGlobals = {
    log: { func: log, wait: 0 },
    stepForward: { func: stepForward, wait: 1000 },
    turnRight: { func: turnRight, wait: 1000 },
    turnLeft: { func: turnLeft, wait: 1000 },
    turnAround: { func: turnAround, wait: 1000 },
    // 必要に応じて追加
  };

  export function log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const log = `[${timestamp}] ${message}`;
    codeExeProps.logs = [...codeExeProps.logs, log];
    scrollToBottom();
  }

  export function stepForward(): void {
    const directions: Record<Direction, { row: number; col: number; wall: "r" | "b"; checkCurrentCell: boolean }> = {
      up: { row: -1, col: 0, wall: "b", checkCurrentCell: false },
      down: { row: 1, col: 0, wall: "b", checkCurrentCell: true },
      left: { row: 0, col: -1, wall: "r", checkCurrentCell: false },
      right: { row: 0, col: 1, wall: "r", checkCurrentCell: true },
    };
    const direction = directions[currentDirection];
    const newRow = currentPos.row + direction.row;
    const newCol = currentPos.col + direction.col;
    const currentCell = parsedMazeMatrix[currentPos.row][currentPos.col];
    const nextCell = parsedMazeMatrix[newRow]?.[newCol];
    if (
      newRow >= 0 &&
      newRow < parsedMazeMatrix.length &&
      newCol >= 0 &&
      newCol < parsedMazeMatrix[0].length &&
      (!direction.checkCurrentCell ? !nextCell[direction.wall] : !currentCell[direction.wall])
    ) {
      currentPos = { row: newRow, col: newCol };
    } else {
      log(`stepForward(): Can't move ${currentDirection}.`);
    }
    checkGoal();
    turnCounter++;
  }

  function checkGoal(): void {
    if (currentPos.row === labyrinthSetting.goalPos.row && currentPos.col === labyrinthSetting.goalPos.col) {
      log("Reached Goal!");
      toastStore.trigger(simpleToast("Goal!!", "Succeed"));
      isRunning = false;
      workerClient.terminate();
    }
  }

  function turn(to: "left" | "right" | "around", currentDirection: Direction): Direction {
    const directions = Object.values(Direction);
    const currentIndex = directions.indexOf(currentDirection);
    const bias = to === "around" ? 2 : to === "right" ? 1 : -1;
    const newIndex = (currentIndex + bias + directions.length) % directions.length;
    return directions[newIndex];
  }

  function turnRight(): void {
    currentDirection = turn("right", currentDirection);
    turnCounter++;
  }

  function turnLeft(): void {
    currentDirection = turn("left", currentDirection);
    turnCounter++;
  }

  function turnAround(): void {
    currentDirection = turn("around", currentDirection);
    turnCounter++;
  }

  let isRunning = false;
  const toastStore = getToastStore();
  function handleExecute(): void {
    if (isRunning) {
      isRunning = false;
      workerClient.terminate();
    } else {
      isRunning = true;
      workerClient.run(
        codeExeProps.code,
        {
          ...labyrinthGlobals,
          // ...codeExeProps.allowedGlobals,
        },
        (result: WorkerResult) => {
          codeExeProps.resultString = result.resultString;
          toastStore.trigger(simpleToast(result.message, result.status));
          isRunning = false;
        },
      );
    }
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

  const cAbsoluteCenter = "absolute inset-0 flex items-center justify-center";
</script>

<div class="grid grid-cols-1 lg:grid-cols-3 justify-center items-top gap-4 m-4">
  <div class="col-span-1">
    <div class="flex flex-col justify-center items-center">
      <div>
        <div class="flex justify-between ml-2">
          <strong class="cIndexSpan">Maze</strong>
        </div>
        <div class="bg-gray-400 border border-gray-500 p-4">
          {#each parsedMazeMatrix as row, rowIndex}
            <div class="flex">
              {#each row as cell, colIndex}
                <div
                  class="relative w-10 h-10 bg-gray-200 box-border border border-gray-300"
                  class:border-r-2={cell.r}
                  class:border-r-black={cell.r}
                  class:border-b-2={cell.b}
                  class:border-b-black={cell.b}
                >
                  {#if rowIndex === labyrinthSetting.startPos.row && colIndex === labyrinthSetting.startPos.col}
                    <div class={cAbsoluteCenter}>
                      <span class="text-blue-500">S</span>
                    </div>
                  {/if}
                  {#if rowIndex === labyrinthSetting.goalPos.row && colIndex === labyrinthSetting.goalPos.col}
                    <div class={cAbsoluteCenter}>
                      <span class="text-blue-500">G</span>
                    </div>
                  {/if}
                  {#if rowIndex === currentPos.row && colIndex === currentPos.col}
                    <div class={cAbsoluteCenter}>
                      <div class="relative">
                        <span class="{cAbsoluteCenter} text-blue-500 text-2xl">●</span>
                        <span class="{cAbsoluteCenter} text-white text-sm">
                          {directionStringMap[currentDirection]}
                        </span>
                      </div>
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
            <span> {isRunning ? "Stop" : "Execute"} </span>
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
