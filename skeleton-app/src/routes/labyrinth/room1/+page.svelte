<script lang="ts">
  import type { AllowedGlobals } from "$lib/utils/safeEval";
  import type { CodeExeProps } from "$lib/types/props";
  import LabyrinthExplorer from "$lib/components/LabyrinthExplorer.svelte";

  let labyrinthExplorerRef: LabyrinthExplorer;
  let codeExeProps: CodeExeProps = {
    code: "",
    resultString: "",
    logs: [],
  };

  function customFunction(): void {
    labyrinthExplorerRef.log("Custom function called.");
  }

  const allowedGlobals: AllowedGlobals = {
    customFunction: customFunction,
    // 必要に応じて追加
  };
</script>

<div class="cRouteBodyStyle">
  <div class="cResponsiveCodeExecuter">
    <LabyrinthExplorer bind:this={labyrinthExplorerRef} bind:codeExeProps {allowedGlobals} />
  </div>
</div>
