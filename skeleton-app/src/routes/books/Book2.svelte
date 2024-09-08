<script lang="ts">
  import type { AllowedGlobals } from "$lib/utils/safeEval";
  import type { CodeExeProps } from "$lib/types/props";
  import CodeExecuter from "$lib/components/CodeExecuter.svelte";

  const sampleCode = `const number = 10;
let result;
if (number % 2 === 0) {
  result = number + " is Even.";
} else {
  result = number + " is Odd.";
}
return result;`;

  let codeExecuterRef: CodeExecuter;
  let codeExeProps: CodeExeProps = {
    code: sampleCode,
    resultString: "",
    logs: [],
  };

  const allowedGlobals: AllowedGlobals = {};
</script>

<div>
  <h2 class="cBookTitle">Book2 : 条件分岐</h2>
  <hr class="cBorderLine" />
  <div class="cResponsiveCodeExecuter">
    <CodeExecuter bind:this={codeExecuterRef} bind:codeExeProps {allowedGlobals} />
  </div>
  <hr class="cBorderLine" />
</div>
