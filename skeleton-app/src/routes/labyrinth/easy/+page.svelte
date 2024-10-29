<script lang="ts">
  import type { CodeExeProps } from "$lib/types/props";
  import type { Cell, Position, LabyrinthSetting } from "$lib/types/labyrinthSetting";
  import { Direction } from "$lib/types/labyrinthSetting";
  import LabyrinthExplorer from "$lib/components/LabyrinthExplorer.svelte";

  const initialCode = `let loops = 0
while (true) {
  for (let i = 0; i < 4; i++) {
    goStraight();
  }
  if (loops % 2 === 0) {
    turnRight();
  } else {
    turnLeft();
  }
  loops += 1
}`;

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
  const startPos: Position = { row: maze.length - 1, col: 0 };
  const goalPos: Position = { row: 0, col: maze[0].length - 1 };
  const initialDirection = Direction.Up;
  const labyrinthSetting: LabyrinthSetting = {
    maze,
    startPos,
    goalPos,
    initialDirection,
  };

  let labyrinthExplorerRef: LabyrinthExplorer;
  let codeExeProps: CodeExeProps = {
    allowedGlobals: {},
    code: initialCode,
    resultString: "",
    logs: [],
  };
</script>

<div class="cRouteBodyStyle">
  <LabyrinthExplorer bind:this={labyrinthExplorerRef} bind:codeExeProps {labyrinthSetting} />
</div>
