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
  function highlightCodeElement(id: string, code: string): void {
    const codeElement = document.getElementById(id) as HTMLElement;

    // コードを書き換えて再適用することができないため、新しい要素を作成して置き換える
    const newElement = document.createElement("code");
    newElement.id = id;
    newElement.innerHTML = code;
    newElement.className = codeElement.className;
    hljs.highlightElement(newElement);
    codeElement.replaceWith(newElement);
  }

  const linesLimit = 12;
  function updateCode(event: Event | undefined = undefined): void {
    if (event) {
      const target = event.target as HTMLTextAreaElement;
      const lines = target.value.split("\n");
      if (lines.length > linesLimit) {
        target.value = lines.slice(0, 12).join("\n");
      }
    }
    highlightCodeElement(highlightElementId, code);
  }

  onMount(() => {
    updateCode();
  });

  const cCodeAreaSize = "w-96 h-80";
</script>

<div class="relative h-full">
  <!-- 編集可能なコードブロック -->
  <textarea
    id={textEditorElementId}
    bind:value={code}
    on:input={updateCode}
    rows="10"
    cols={linesLimit}
    class="
      {cCodeAreaSize} p-4 border border-gray-300 rounded-md
      font-mono text-transparent bg-transparent caret-white custom-selection
      resize-none overflow-hidden
      absolute top-0 left-0 z-10
    "
  ></textarea>

  <!-- ハイライトされたコードブロック -->
  <pre class="{cCodeAreaSize} relative -top-6 z-0">
    <code id={highlightElementId} class="{cLanguage} h-full w-full rounded-md">
      {code}
    </code>
  </pre>
</div>

<style>
  .custom-selection::selection {
    background-color: rgba(255, 255, 255, 0.9); /* 背景色 */
    color: black; /* テキスト色 */
  }
</style>
