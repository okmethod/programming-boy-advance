<script lang="ts">
  import HighlightCodeEditor from "$lib/components/HighlightCodeEditor.svelte";

  const sampleCode = `
function helloWorld() {
  console.log('Hello, world!');
}

//helloWorld();
customFunction();

`;

  let code = sampleCode;
  function executeCode(): void {
    try {
      safeEval(code);
      console.log("Executed successfully.");
    } catch (error) {
      console.error("Failed to execute code:", error);
    }
  }

  function customFunction() {
    console.log("Custom function called.");
  }

  function safeEval(code: string): unknown {
    const allowedGlobals: Record<string, unknown> = {
      customFunction: customFunction,
      // 必要に応じて追加
    };

    const proxy = new Proxy(allowedGlobals, {
      has: () => true,
      get: (target, prop) => {
        if (typeof prop === "string" && prop in target) {
          return target[prop];
        }
        return undefined;
      },
    });

    // 新しい関数を作成し、プロキシを使用してコードを実行
    const executeCode = (code: string, context: any) => {
      return new Function(
        "context",
        `
          with (context) {
            ${code}
          }
        `,
      )(context);
    };

    return executeCode(code, proxy);
  }
</script>

<div class="cRouteBodyStyle">
  <!-- タイトル部 -->
  <div class="cTitlePartStyle md:!mb-4">
    <h1 class="cTitleStyle md:!text-3xl">Highlight Code Editor</h1>
  </div>

  <!-- コンテンツ部 -->
  <div class="cContentPartStyle !m-4">
    <HighlightCodeEditor bind:code cLanguage="language-javascript" />
    <button type="submit" on:click={executeCode} class="cIconButtonStyle">
      <div class="cButtonSpan">
        <span> Execute </span>
      </div>
    </button>
  </div>
</div>
