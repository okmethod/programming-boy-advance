<script lang="ts">
  import type { CodeExeProps } from "$lib/types/props";
  import type { Cell, Position, LabyrinthSetting } from "$lib/types/labyrinthSetting";
  import { Direction } from "$lib/types/labyrinthSetting";
  import LabyrinthExplorer from "$lib/components/LabyrinthExplorer.svelte";

  const initialCode = `goStraight();
goStraight();
goStraight();
goStraight();`;

  // prettier-ignore
  const maze: Cell[][] = [
    ["00", "10", "10", "00", "00"],
    ["00", "10", "10", "00", "00"],
    ["00", "10", "10", "00", "00"],
    ["00", "10", "10", "00", "00"],
    ["00", "10", "10", "00", "00"],
  ];
  const startPos: Position = { row: maze.length - 1, col: 2 };
  const goalPos: Position = { row: 0, col: 2 };
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
