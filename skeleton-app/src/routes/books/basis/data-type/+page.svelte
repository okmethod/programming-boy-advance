<script lang="ts">
  import type { AllowedGlobals } from "$lib/utils/safeEval";
  import type { CodeExeProps } from "$lib/types/props";
  import CodeSpan from "$lib/components/CodeSpan.svelte";
  import CodeExecuter from "$lib/components/CodeExecuter.svelte";

  const sampleCode = `const num = 10;
log("number: " + num);
log('"number": ' + "num");
log("number+: " + (num + num));

const str = "100";
log("string: " + str);
log('"string": ' + "str");
log("string+: " + (str + str));

return str + num;`;

  let codeExecuterRef: CodeExecuter;
  let codeExeProps: CodeExeProps = {
    code: sampleCode,
    resultString: "",
    logs: [],
  };

  const allowedGlobals: AllowedGlobals = {};
</script>

<div class="cBookContents">
  <h2 class="cLessonTitle">データの型</h2>
  <div class="w-full">
    <hr class="cBorderLine" />
    <p>
      変数には様々なデータを代入することができます。データの種類を「型」とよびます。
      <br />
      型には様々な種類があり、たとえば「数値型(<CodeSpan data={["Number", "white"]} />)」や「文字列型(<CodeSpan
        data={["String", "white"]}
      />)」があります。
    </p>
    <hr class="cBorderLine" />
    <p>
      数字は、囲み文字<CodeSpan data={[`""`, "lightblue"]} />で囲むと文字列型になり、囲まないと数値型として扱われます。
      <br />
      数字以外の文字を含む場合は、囲むと文字列型になり、囲まないと変数として扱われます。
    </p>
    <p>
      このプログラムを実行して、<CodeSpan data={["num", "white"]} /> と <CodeSpan data={["str", "white"]} /> がどのように扱われるか見てみましょう。
    </p>
    <hr class="cBorderLine" />
  </div>

  <div class="cResponsiveCodeExecuter">
    <CodeExecuter bind:this={codeExecuterRef} bind:codeExeProps {allowedGlobals} />
  </div>

  <div class="w-full">
    <hr class="cBorderLine" />
    <p>
      また、<CodeSpan data={[`+`, "white"]} /> のような操作を「演算子」とよびますが、データの型によって演算子の効果が変わることがあります。
      <br />
      例えば、数値型同士を <CodeSpan data={["num + num", "white"]} /> すると足し算をしますが、文字列型同士を <CodeSpan
        data={["str + str", "white"]}
      /> すると文字列をつなぎます。
      <br />
      そして、文字列型と数値型を <CodeSpan data={["str + num", "white"]} /> すると、数値型が文字列型に変換され、文字列としてつなぎます。
    </p>
    <hr class="cBorderLine" />
    <p>
      では、演算子 <CodeSpan data={["-", "white"]} /> を使うとどうなるでしょう？
      <CodeSpan data={["str - num", "white"]} /> に書き換えて実行してみましょう。
      <br />
      結果は予想通りでしたか？それとも不思議な結果でしたか？
    </p>
    <hr class="cBorderLine" />
  </div>
</div>
