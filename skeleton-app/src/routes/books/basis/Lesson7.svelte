<script lang="ts">
  import type { AllowedGlobals } from "$lib/utils/safeEval";
  import type { CodeExeProps } from "$lib/types/props";
  import CodeSpan from "$lib/components/CodeSpan.svelte";
  import CodeExecuter from "$lib/components/CodeExecuter.svelte";
  import { navigateTo } from "$lib/utils/navigation.client";

  const sampleCode = `const nums = [1, 2, 3, 4, 5, 6];
let oddNums = [];
for (let num of nums) {
  log("loop: num = " + num);
  if (num % 2 !== 0) {
    oddNums = [...oddNums, num];
  }
}

return oddNums;`;

  let codeExecuterRef: CodeExecuter;
  let codeExeProps: CodeExeProps = {
    code: sampleCode,
    resultString: "",
    logs: [],
  };

  const allowedGlobals: AllowedGlobals = {};
</script>

<div>
  <h2 class="cBookTitle">プログラムの基礎 Lesson7 : ループ と 条件分岐 の組み合わせ</h2>
  <div>
    <hr class="cBorderLine" />
    <p>ループと条件分岐を組み合わせることで、より複雑な処理を行うことができます。</p>
    <hr class="cBorderLine" />
    <p>
      このプログラムでは、1 から 6 までの数値の中から、奇数だけを取り出しています。
      <br />
      ループの条件式を <CodeSpan
        data={[
          ["for ", "red"],
          ["(", "white"],
          ["let ", "red"],
          ["num ", "white"],
          ["of ", "red"],
          ["nums)", "white"],
        ]}
      /> のように書くと、配列の要素を 1つずつ取り出して処理することができます。
      <br />
      ループ処理を 6回繰り返し、それぞれの数値を <CodeSpan
        data={[
          ["if ", "red"],
          ["(num % ", "white"],
          ["2", "blue"],
          [" !== ", "white"],
          ["0", "blue"],
          [")", "white"],
        ]}
      /> で奇数か偶数か判定しています。
      <br />
      なお、 <CodeSpan data={["!==", "white"]} /> は等しくない場合に「真」を返す演算子です。
      <br />
      この例では、2で割り切れない場合に「真」となるため、奇数の場合のみ分岐内の処理を実行します。
    </p>
    <hr class="cBorderLine" />
  </div>

  <div class="cResponsiveCodeExecuter">
    <CodeExecuter bind:this={codeExecuterRef} bind:codeExeProps {allowedGlobals} />
  </div>

  <div>
    <hr class="cBorderLine" />
    <p>
      ここまでで、プログラミングの基礎的な概念を学びました。
      <br />
      「<button on:click|preventDefault={() => navigateTo("/executer")}>
        <span class="cLinkButtonStyle">Test Code Executer</span>
      </button>」は自由にプログラムを書いて実行できる環境です。試してみましょう！
    </p>
    <hr class="cBorderLine" />
  </div>
</div>
