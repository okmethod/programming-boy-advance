<script lang="ts">
  import type { AllowedGlobals } from "$lib/utils/safeEval";
  import type { CodeExeProps } from "$lib/types/props";
  import CodeExecuter from "$lib/components/CodeExecuter.svelte";

  const sampleCode = `
  const oddNumbers = [];
  for (let i = 1; i <= 10; i++) {
    if (i % 2 !== 0) {
      log(i + " is Odd.");
      oddNumbers.push(i);
    } else {
      log(i + " is Even.");
    }
  }
  return oddNumbers;
  `;

  let codeExecuterRef: CodeExecuter;
  let codeExeProps: CodeExeProps = {
    code: sampleCode,
    resultString: "",
    logs: [],
  };

  function customFunction(): void {
    codeExecuterRef.log("Custom function called.");
  }

  const allowedGlobals: AllowedGlobals = {
    customFunction: customFunction,
    // 必要に応じて追加
  };
</script>

<div class="cRouteBodyStyle">
  <!-- タイトル部 -->
  <div class="cTitlePartStyle md:!mb-4">
    <h1 class="cTitleStyle md:!text-3xl">PGM Books</h1>
  </div>

  <!-- コンテンツ部 -->
  <div class="grid grid-cols-1 lg:grid-cols-12 justify-center items-center gap-4 m-4">
    <CodeExecuter bind:this={codeExecuterRef} bind:codeExeProps {allowedGlobals} />
  </div>
</div>
