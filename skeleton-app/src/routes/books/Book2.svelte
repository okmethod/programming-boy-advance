<script lang="ts">
  import type { AllowedGlobals } from "$lib/utils/safeEval";
  import type { CodeExeProps } from "$lib/types/props";
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
  <div class="font-pixel12">
    <p>プログラムには、2つの重要なアイテムがあります。それは「変数」と「関数」です。</p>
    <hr class="cBorderLine" />
    <p>
      「変数」は、「データ」を保存するための箱のようなものです。 データを変数に保存することを、「代入する」といいます。
    </p>
    <p>
      このプログラムでは、
      <span class="cBookCodeBlock">
        <span class="hljs-keyword">let</span>
        <span class="text-white">number</span>
      </span>
      で変数を定義しています。
      <span class="cBookCodeBlock hljs-keyword">let</span> は変数の種類で、
      <span class="cBookCodeBlock text-white">number</span> は変数の名前です。<br />
      この変数に <span class="cBookCodeBlock hljs-number">10</span> という数値を代入しています。
    </p>
    <hr class="cBorderLine" />
    <p>
      「関数」は、「操作」を保存するための箱のようなものです。
      関数を呼び出すことで、それらの操作をまとめて実行できます。<br />
      関数に渡すデータを「引数」といい、関数から返されるデータを「戻り値」といいます。
    </p>
    <p>
      このプログラムでは、
      <span class="cBookCodeBlock">
        <span class="hljs-keyword">function</span>
        <span class="hljs-title">double()</span>
      </span>
      で関数を定義しています。<br />
      <span class="cBookCodeBlock hljs-keyword">function</span> は関数を表しており、
      <span class="cBookCodeBlock hljs-title">double</span> は関数の名前です。<br />
      この関数は、引数 <span class="cBookCodeBlock text-white">num</span> を受け取り、その値を2倍にして返します。
    </p>
    <hr class="cBorderLine" />
    <p>
      では、このプログラムを実行してみましょう。 <br />
      変数<span class="cBookCodeBlock text-white">number</span>が、 関数
      <span class="cBookCodeBlock hljs-title">double</span>
      によって変化していく様子がわかるでしょうか？<br />
      （ヒント：<span class="cIndexSpan">logs</span> で、実行中の値の変化を確認できます）
    </p>
  </div>
  <hr class="cBorderLine" />
  <div class="cResponsiveCodeExecuter">
    <CodeExecuter bind:this={codeExecuterRef} bind:codeExeProps {allowedGlobals} />
  </div>
  <hr class="cBorderLine" />
  <div class="font-pixel12">
    <p>
      実は、変数は 2種類あります。それは <span class="cBookCodeBlock hljs-keyword">let</span> と
      <span class="cBookCodeBlock hljs-keyword">const</span> です。<br />
      <span class="cBookCodeBlock hljs-keyword">let</span> は何度でも代入でき、値を書き換えることができる変数です。
      <br />
      一方で、<span class="cBookCodeBlock hljs-keyword">const</span>
      は一度しか代入できず、値を書き換えることができない変数です。<br />
      このプログラムでは
      <span class="cBookCodeBlock">
        <span class="hljs-keyword">let</span>
        <span class="text-white">number</span>
      </span>
      で変数を定義していますが、<br />
      もし、これを
      <span class="cBookCodeBlock">
        <span class="hljs-keyword">const</span>
        <span class="text-white">number</span>
      </span>
      に変更してから実行したら、結果はどうなるでしょうか？
    </p>
  </div>
  <hr class="cBorderLine" />
</div>
