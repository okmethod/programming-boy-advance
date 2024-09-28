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
  <h2 class="cBookTitle">プログラムの基礎 Lesson2 : 変数 と 関数</h2>
  <div>
    <hr class="cBorderLine" />
    <p>プログラムには、2つの重要なアイテムがあります。それは「変数」と「関数」です。</p>
    <hr class="cBorderLine" />
    <p>
      「変数」は、「データ」を保存するための箱のようなものです。 データを変数に保存することを、「代入する」とよびます。
    </p>
    <p>
      このプログラムでは、<CodeSpan
        data={[
          ["let ", "red"],
          ["number", "white"],
        ]}
      /> で変数を定義しています。
      <CodeSpan data={["let", "red"]} /> は変数の種類で、
      <CodeSpan data={["number", "white"]} /> は変数の名前です。
      <br />
      この変数に <CodeSpan data={["10", "blue"]} /> という数値を代入しています。
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
          ["function ", "red"],
          ["double", "purple"],
          ["()", "white"],
        ]}
      /> で関数を定義しています。
      <br />
      <CodeSpan data={["function", "red"]} /> は関数を表しており、
      <CodeSpan data={["double", "purple"]} /> は関数の名前です。
      <br />
      この関数は、引数<CodeSpan data={["num", "white"]} /> を受け取り、その値を2倍にして返します。
    </p>
    <hr class="cBorderLine" />
    <p>
      では、このプログラムを実行してみましょう。 <br />
      変数<CodeSpan data={["number", "white"]} /> が、関数<CodeSpan data={["double", "purple"]} /> によって変化していく様子がわかるでしょうか？
      <br />
      （ヒント：<span class="cIndexSpan">logs</span> で、実行中の値の変化を確認できます）
    </p>
    <hr class="cBorderLine" />
  </div>

  <div class="cResponsiveCodeExecuter">
    <CodeExecuter bind:this={codeExecuterRef} bind:codeExeProps {allowedGlobals} />
  </div>

  <div>
    <hr class="cBorderLine" />
    <p>
      実は、変数は 2種類あります。それは <CodeSpan data={["let", "red"]} /> と
      <CodeSpan data={["const", "red"]} /> です。
      <br />
      <CodeSpan data={["let", "red"]} /> は何度でも代入でき、値を書き換えることができる変数です。
      <br />
      一方で、<CodeSpan data={["const", "red"]} /> は一度しか代入できず、値を書き換えることができない変数です。
      <br />
      このプログラムでは <CodeSpan
        data={[
          ["let ", "red"],
          ["number", "white"],
        ]}
      /> で変数を定義していますが、
      <br />
      もし、これを <CodeSpan
        data={[
          ["const ", "red"],
          ["number", "white"],
        ]}
      /> に変更してから実行したら、結果はどうなるでしょうか？
    </p>
    <hr class="cBorderLine" />
  </div>
</div>
