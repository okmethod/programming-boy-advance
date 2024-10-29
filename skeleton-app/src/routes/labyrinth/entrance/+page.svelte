<script lang="ts">
  import type { CodeExeProps } from "$lib/types/props";
  import type { Cell, Position, MazeSetting } from "$lib/types/mazeSetting";
  import { Direction } from "$lib/types/mazeSetting";
  import LabyrinthExplorer from "$lib/components/LabyrinthExplorer.svelte";

  const initialCode = `stepForward();
stepForward();
stepForward();
stepForward();`;

  // prettier-ignore
  const mazeMatrix: Cell[][] = [
    ["00", "10", "10", "00", "00"],
    ["00", "10", "10", "00", "00"],
    ["00", "10", "10", "00", "00"],
    ["00", "10", "10", "00", "00"],
    ["00", "10", "10", "00", "00"],
  ];
  const startPos: Position = { row: mazeMatrix.length - 1, col: 2 };
  const goalPos: Position = { row: 0, col: 2 };
  const initialDirection = Direction.Up;
  const mazeSetting: MazeSetting = {
    mazeMatrix,
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
  <LabyrinthExplorer bind:this={labyrinthExplorerRef} bind:codeExeProps {mazeSetting} />
</div>
