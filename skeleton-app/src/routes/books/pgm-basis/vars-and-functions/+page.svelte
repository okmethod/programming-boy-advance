<script lang="ts">
  import type { AllowedGlobals } from "$lib/utils/safeEval";
  import type { CodeExeProps } from "$lib/types/props";
  import CodeSpan from "$lib/components/CodeSpan.svelte";
  import CodeExecuter from "$lib/components/CodeExecuter.svelte";

  const sampleCode = `function double(arg) {
  return arg * 2;
}

let num = 10;
log("num1: " + num);
num = double(num);
log("num2: " + num);
num = double(num);
log("num3: " + num);

return num;`;

  let codeExecuterRef: CodeExecuter;
  let codeExeProps: CodeExeProps = {
    code: sampleCode,
    resultString: "",
    logs: [],
  };

  const allowedGlobals: AllowedGlobals = {};
</script>

<div class="cBookContents">
  <h2 class="cLessonTitle">変数と関数</h2>
  <div class="w-full">
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
          ["num", "white"],
        ]}
      /> で変数を定義しています。
      <CodeSpan data={["let", "red"]} /> は変数の種類で、
      <CodeSpan data={["num", "white"]} /> は変数の名前です。
      <br />
      変数名は何でもOKですが、わかりやすい名前をつけることが大切です。（ちなみに、<CodeSpan data={["num", "white"]} /> は
      "number" の頭文字からとった名前です）
      <br />
      また、<CodeSpan
        data={[
          ["num = ", "white"],
          ["10", "blue"],
        ]}
      /> という式は、変数
      <CodeSpan data={["num", "white"]} />
      に <CodeSpan data={["10", "blue"]} /> という数値を代入しています。
      <br />
      （注意：プログラムにおける <CodeSpan data={["=", "white"]} /> は「等しい」という意味ではなく、「代入する」という意味です）
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
      この関数は、引数<CodeSpan data={["arg", "white"]} /> を受け取り、その値を2倍にして返します。
    </p>
    <hr class="cBorderLine" />
    <p>
      では、このプログラムを実行してみましょう。 <br />
      変数<CodeSpan data={["num", "white"]} /> が、関数<CodeSpan data={["double", "purple"]} /> によって変化していく様子がわかるでしょうか？
      <br />
      （ヒント：<span class="cIndexSpan">logs</span> で、実行中の値の変化を確認できます）
    </p>
    <hr class="cBorderLine" />
  </div>

  <CodeExecuter bind:this={codeExecuterRef} bind:codeExeProps {allowedGlobals} />

  <div class="w-full">
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
          ["num", "white"],
        ]}
      /> で変数を定義していますが、
      <br />
      もし、これを <CodeSpan
        data={[
          ["const ", "red"],
          ["num", "white"],
        ]}
      /> に変更してから実行したら、結果はどうなるでしょうか？
    </p>
    <hr class="cBorderLine" />
  </div>
</div>
