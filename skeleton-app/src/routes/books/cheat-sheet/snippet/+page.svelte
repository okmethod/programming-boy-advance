<script lang="ts">
  import HighlightCodeEditor from "$lib/components/HighlightCodeEditor.svelte";

  const codeSnippets = [
    {
      title: "変数",
      code: `
// 再代入可能な変数
let x = 10;

// 再代入不可な定数
const y = 20;

// 配列
const list = [1, 2, 3, 4, 5];`,
    },
    {
      title: "関数",
      code: `
function greet(name) {
  return \`Hello, \${name}!\`;
}`,
    },
    {
      title: "if分岐",
      code: `
if (x > 10) {
  console.log("x は 10 より大きい");
} else if (x === 10) {
  console.log("x は 10 と等しい");
} else {
  console.log("x は 10 より小さい");
}`,
    },
    {
      title: "forループ",
      code: `
// 5回繰り返す
for (let i = 0; i < 5; i++) {
  console.log(i);
}

// 配列の要素数の数だけ繰り返す
const list = [1, 2, 3, 4, 5];
for (const item of list) {
  console.log(item);
}`,
    },
    {
      title: "whileループ",
      code: `
// 5回繰り返す
let count = 0;
while (count < 5) {
  console.log(count);
  count++;
}

// 無限ループ
while (true) {
  if (condition) break; // 終了
}`,
    },
  ];
</script>

<div class="cBookContents">
  <h2 class="cLessonTitle">よく使うプログラムの書き方</h2>
  <hr class="cBorderLine" />

  <div class="p-4">
    {#each codeSnippets as snippet}
      <h3 class="text-lg font-bold mt-4">{snippet.title}</h3>
      <HighlightCodeEditor code={snippet.code} cLanguage="language-javascript" />
    {/each}
  </div>
</div>
