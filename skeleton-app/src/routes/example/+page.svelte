<script lang="ts">
  import { onMount } from "svelte";
  import { storeHighlightJs } from "@skeletonlabs/skeleton";
  import { get } from "svelte/store";

  const hljs = get(storeHighlightJs);
  function highlightCodeElement(id: string, code: string) {
    const codeElement = document.getElementById(id) as HTMLElement;

    // コードを書き換えて再適用することができないため、新しい要素を作成して置き換える
    const newElement = document.createElement("code");
    newElement.id = id;
    newElement.innerHTML = code;
    newElement.className = codeElement.className;
    hljs.highlightBlock(newElement);
    codeElement.replaceWith(newElement);
  }

  const sampleCode = `
function helloWorld() {
  console.log('Hello, world!');
}

`;

  const textEditorElementId = "code-editor";
  const highlightElementId = "code-block";
  let code = sampleCode;
  function updateCode() {
    highlightCodeElement(highlightElementId, code);
  }

  onMount(() => {
    updateCode();
  });

  const cLanguage = "language-javascript";
  const cCodeArea = "w-96 h-80 p-4 border border-gray-300 rounded-md";
</script>

<div class="cRouteBodyStyle">
  <!-- タイトル部 -->
  <div class="cTitlePartStyle md:!mb-4">
    <h1 class="cTitleStyle md:!text-3xl">Highlight Code Editor</h1>
  </div>

  <!-- コンテンツ部 -->
  <div class="cContentPartStyle !m-4">
    <div class="relative">
      <!-- 編集可能なコードブロック -->
      <textarea
        id={textEditorElementId}
        bind:value={code}
        on:input={updateCode}
        rows="10"
        cols="10"
        class="{cCodeArea} font-mono text-transparent bg-transparent caret-white absolute top-6 left-0 z-10"
      ></textarea>

      <!-- ハイライトされたコードブロック -->
      <pre>
      <code id={highlightElementId} class="{cCodeArea} {cLanguage} relative z-0">
        {code}
      </code>
      </pre>
    </div>
  </div>
</div>
