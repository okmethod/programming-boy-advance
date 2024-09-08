<script lang="ts">
  import type { AllowedGlobals } from "$lib/utils/safeEval";
  import type { CodeExeProps } from "$lib/types/props";
  import CodeExecuter from "$lib/components/CodeExecuter.svelte";

  const sampleCode = `const oddNumbers = [];
for (let i = 1; i <= 10; i++) {
  if (i % 2 !== 0) {
    log(i + " is Odd.");
    oddNumbers.push(i);
  } else {
    log(i + " is Even.");
  }
}
return oddNumbers;`;

  let codeExecuterRef: CodeExecuter;
  let codeExeProps: CodeExeProps = {
    code: sampleCode,
    resultString: "",
    logs: [],
  };

  const allowedGlobals: AllowedGlobals = {};
</script>

<div>
  <h2 class="cBookTitle">Book4 : ループ と 条件分岐 の組み合わせ</h2>
  <hr class="cBorderLine" />
  <div class="cResponsiveCodeExecuter">
    <CodeExecuter bind:this={codeExecuterRef} bind:codeExeProps {allowedGlobals} />
  </div>
  <hr class="cBorderLine" />
</div>
