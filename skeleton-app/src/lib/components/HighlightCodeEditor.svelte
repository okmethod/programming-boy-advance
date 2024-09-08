<script lang="ts">
  import { onMount } from "svelte";
  import { getToastStore, storeHighlightJs } from "@skeletonlabs/skeleton";
  import { get } from "svelte/store";
  import { browser } from "$app/environment";
  import { simpleToast } from "$lib/utils/toastSettings";

  export let code: string;
  export let cLanguage: string;

  const uniqueId = Math.random().toString(36).slice(2, 11);
  const textEditorElementId = `code-editor-${uniqueId}`;
  const highlightElementId = `code-block-${uniqueId}`;

  const toastStore = getToastStore();

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

  function updateCode(event: Event | undefined = undefined): void {
    if (!browser) return;
    if (event) {
      const target = event.target as HTMLTextAreaElement;
      const lines = target.value.split("\n");
      if (isExceedLimit(lines)) {
        toastStore.trigger(simpleToast("Textarea overflow.", "Warning"));
        const start = target.selectionStart;
        event.preventDefault();
        event.stopImmediatePropagation();
        target.value = code; // 元の値に戻す
        target.setSelectionRange(start - 1, start - 1);
        return;
      }
      code = target.value; // 現在の値を保存
    }
    highlightCodeElement(highlightElementId, code);
  }

  const linesLimit = 12;
  const charsLimit = 36;
  const isExceedLimit = (lines: string[]): boolean => {
    if (lines.length > linesLimit) {
      return true;
    }
    for (const line of lines) {
      if (countChars(line) > charsLimit) {
        return true;
      }
    }
    return false;
  };

  function countChars(line: string): number {
    let count = 0;
    for (const char of line) {
      // 日本語の文字（全角文字）を2文字分としてカウント
      const codePoint = char.codePointAt(0);
      if (codePoint && (codePoint > 0xff || codePoint < 0x20)) {
        count += 2;
      } else {
        count += 1;
      }
    }
    return count;
  }

  let isMounted = false;
  onMount(() => {
    updateCode();
    isMounted = true;
  });

  $: if (isMounted && code !== undefined) {
    updateCode();
  }

  const cCodeAreaSize = "w-96 h-80";
</script>

<div class="relative h-full">
  <!-- 編集可能なコードブロック -->
  <textarea
    id={textEditorElementId}
    value={code}
    on:input={updateCode}
    rows={linesLimit}
    cols={charsLimit}
    class="
      {cCodeAreaSize} p-4 border border-gray-300 rounded-md
      font-mono text-transparent bg-transparent caret-white custom-selection
      resize-none whitespace-nowrap overflow-hidden
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
