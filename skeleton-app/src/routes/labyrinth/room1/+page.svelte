<script lang="ts">
  import type { CodeExeProps } from "$lib/types/props";
  import LabyrinthExplorer from "$lib/components/LabyrinthExplorer.svelte";

  let labyrinthExplorerRef: LabyrinthExplorer;
  let codeExeProps: CodeExeProps = {
    allowedGlobals: {
      customFunction: customFunction,
      // 必要に応じて追加
    },
    code: "",
    resultString: "",
    logs: [],
  };

  function customFunction(): void {
    labyrinthExplorerRef.log("Custom function called.");
  }
</script>

<div class="cRouteBodyStyle">
  <LabyrinthExplorer bind:this={labyrinthExplorerRef} bind:codeExeProps />
</div>
