<script lang="ts">
  import type { AllowedGlobals } from "$lib/utils/safeEval";
  import type { CodeExeProps } from "$lib/types/props";
  import CodeExecuter from "$lib/components/CodeExecuter.svelte";

  const sampleCode = `let list = [];
for (let i = 1; i <= 10; i++) {
  log("loop: i = "+ i);
  list.push(i);
}
return list;`;

  let codeExecuterRef: CodeExecuter;
  let codeExeProps: CodeExeProps = {
    code: sampleCode,
    resultString: "",
    logs: [],
  };

  const allowedGlobals: AllowedGlobals = {};
</script>

<div>
  <div class="cResponsiveCodeExecuter">
    <CodeExecuter bind:this={codeExecuterRef} bind:codeExeProps {allowedGlobals} />
  </div>
  <hr class="cBorderLine" />
</div>
