<script lang="ts">
  import type { CodeExeProps } from "$lib/types/props";
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

  let labyrinthExplorerRef: LabyrinthExplorer;
  let codeExeProps: CodeExeProps = {
    allowedGlobals: {},
    code: initialCode,
    resultString: "",
    logs: [],
  };
</script>

<div class="cRouteBodyStyle">
  <LabyrinthExplorer bind:this={labyrinthExplorerRef} bind:codeExeProps />
</div>
