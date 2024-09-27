<script lang="ts">
  import type { AllowedGlobals } from "$lib/utils/safeEval";
  import type { CodeExeProps } from "$lib/types/props";
  import CodeSpan from "$lib/components/CodeSpan.svelte";
  import CodeExecuter from "$lib/components/CodeExecuter.svelte";

  const sampleCode = `function double(num) {
  return num * 2;
}

let number = 10;
log("number: " + number);
number = double(number);
log("number: " + number);
number = double(number);
log("number: " + number);

return number;`;

  let codeExecuterRef: CodeExecuter;
  let codeExeProps: CodeExeProps = {
    code: sampleCode,
    resultString: "",
    logs: [],
  };

  const allowedGlobals: AllowedGlobals = {};
</script>

<div class="max-w-[1000px]">
  <h2 class="cBookTitle">Book2 : 変数 と 関数</h2>
  <hr class="cBorderLine" />
  <div>
    <p>プログラムには、2つの重要なアイテムがあります。それは「変数」と「関数」です。</p>
    <hr class="cBorderLine" />
    <p>
      「変数」は、「データ」を保存するための箱のようなものです。 データを変数に保存することを、「代入する」とよびます。
    </p>
    <p>
      このプログラムでは、<CodeSpan
        data={[
          ["let", "hljs-keyword"],
          [" ", ""],
          ["number", "text-white"],
        ]}
      /> で変数を定義しています。
      <CodeSpan data={["let", "hljs-keyword"]} /> は変数の種類で、
      <CodeSpan data={["number", "text-white"]} /> は変数の名前です。
      <br />
      この変数に <CodeSpan data={["10", "hljs-number"]} /> という数値を代入しています。
    </p>
    <hr class="cBorderLine" />
    <p>
      「関数」は、「操作」を保存するための箱のようなものです。
      関数を呼び出すことで、それらの操作をまとめて実行できます。
      <br />
      関数に渡すデータを「引数」とよび、関数から返されるデータを「戻り値」とよびます。
    </p>
    <p>
      このプログラムでは、<CodeSpan
        data={[
          ["function", "hljs-keyword"],
          [" ", ""],
          ["double", "hljs-title"],
          ["()", "text-white"],
        ]}
      /> で関数を定義しています。
      <br />
      <CodeSpan data={["function", "hljs-keyword"]} /> は関数を表しており、
      <CodeSpan data={["double", "hljs-title"]} /> は関数の名前です。
      <br />
      この関数は、引数<CodeSpan data={["num", "text-white"]} /> を受け取り、その値を2倍にして返します。
    </p>
    <hr class="cBorderLine" />
    <p>
      では、このプログラムを実行してみましょう。 <br />
      変数<CodeSpan data={["number", "text-white"]} /> が、関数<CodeSpan data={["double", "hljs-title"]} /> によって変化していく様子がわかるでしょうか？
      <br />
      （ヒント：<span class="cIndexSpan">logs</span> で、実行中の値の変化を確認できます）
    </p>
  </div>
  <hr class="cBorderLine" />
  <div class="cResponsiveCodeExecuter">
    <CodeExecuter bind:this={codeExecuterRef} bind:codeExeProps {allowedGlobals} />
  </div>
  <hr class="cBorderLine" />
  <div>
    <p>
      実は、変数は 2種類あります。それは <CodeSpan data={["let", "hljs-keyword"]} /> と
      <CodeSpan data={["const", "hljs-keyword"]} /> です。
      <br />
      <CodeSpan data={["let", "hljs-keyword"]} /> は何度でも代入でき、値を書き換えることができる変数です。
      <br />
      一方で、<CodeSpan data={["const", "hljs-keyword"]} />
      は一度しか代入できず、値を書き換えることができない変数です。
      <br />
      このプログラムでは <CodeSpan
        data={[
          ["let", "hljs-keyword"],
          [" ", ""],
          ["number", "text-white"],
        ]}
      /> で変数を定義していますが、
      <br />
      もし、これを <CodeSpan
        data={[
          ["const", "hljs-keyword"],
          [" ", ""],
          ["number", "text-white"],
        ]}
      /> に変更してから実行したら、結果はどうなるでしょうか？
    </p>
  </div>
  <hr class="cBorderLine" />
</div>
