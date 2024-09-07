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

  const id = "code-block";
  let code = sampleCode;
  function updateCode() {
    highlightCodeElement(id, code);
  }

  onMount(() => {
    updateCode();
  });
</script>

<div class="cRouteBodyStyle">
  <!-- タイトル部 -->
  <div class="cTitlePartStyle md:!mb-4">
    <h1 class="cTitleStyle md:!text-3xl">Example route</h1>
  </div>

  <!-- コンテンツ部 -->
  <div class="cContentPartStyle !m-4">
    <!-- 編集可能なコードブロック -->
    <textarea id="code-editor" bind:value={code} on:input={updateCode} rows="10" cols="50"></textarea>

    <!-- コードブロック -->
    <pre>
      <code {id} class="language-javascript">{code}</code>
    </pre>
  </div>
</div>
