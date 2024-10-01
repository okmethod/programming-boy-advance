<script lang="ts">
  import { onDestroy } from "svelte";
  import { writable } from "svelte/store";
  import type { CodeExeProps } from "$lib/types/props";
  import { testCode, unsubscribeTestCode } from "$lib/stores/testCode";
  import CodeExecuter from "$lib/components/CodeExecuter.svelte";

  let codeExecuterRef: CodeExecuter;
  let codeExeProps = writable<CodeExeProps>({
    code: $testCode,
    resultString: "",
    logs: [],
    allowedGlobals: {
      customFunction: customFunction,
      // 必要に応じて追加
    },
  });

  const unsubscribeCodeExeProps = codeExeProps.subscribe((value) => {
    if (value.code !== $testCode) {
      testCode.set(value.code);
    }
  });
  onDestroy(() => {
    unsubscribeCodeExeProps();
    unsubscribeTestCode();
  });

  function customFunction(): void {
    codeExecuterRef.log("Custom function called.");
  }
</script>

<div class="cRouteBodyStyle">
  <!-- タイトル部 -->
  <div class="cTitlePartStyle md:!mb-4">
    <h1 class="cTitleStyle md:!text-3xl">Test Code Executer</h1>
  </div>

  <!-- コンテンツ部 -->
  <CodeExecuter bind:this={codeExecuterRef} bind:codeExeProps={$codeExeProps} />
</div>
