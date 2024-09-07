<script lang="ts">
  import { onMount } from "svelte";
  import { storeHighlightJs } from "@skeletonlabs/skeleton";
  import { get } from "svelte/store";

  export let code: string;
  export let cLanguage: string;

  const uniqueId = Math.random().toString(36).substr(2, 9);
  const textEditorElementId = `code-editor-${uniqueId}`;
  const highlightElementId = `code-block-${uniqueId}`;

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

  function updateCode() {
    highlightCodeElement(highlightElementId, code);
  }

  onMount(() => {
    updateCode();
  });

  const cCodeArea = "w-96 h-80 p-4 border border-gray-300 rounded-md";
</script>

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
