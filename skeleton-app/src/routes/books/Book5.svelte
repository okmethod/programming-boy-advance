<script lang="ts">
  import type { AllowedGlobals } from "$lib/utils/safeEval";
  import type { CodeExeProps } from "$lib/types/props";
  import CodeSpan from "$lib/components/CodeSpan.svelte";
  import CodeExecuter from "$lib/components/CodeExecuter.svelte";

  const sampleCode = `const num = 10;
let result;
if (num % 2 === 0) {
  result = num + " is Even.";
} else {
  result = num + " is Odd.";
}
return result;`;

  let codeExecuterRef: CodeExecuter;
  let codeExeProps: CodeExeProps = {
    code: sampleCode,
    resultString: "",
    logs: [],
  };

  const allowedGlobals: AllowedGlobals = {};
</script>

<div class="max-w-[1000px]">
  <h2 class="cBookTitle">Book5 : 条件分岐</h2>
  <div>
    <hr class="cBorderLine" />
    <p>
      次に紹介する強力なアイテムは「条件分岐(<CodeSpan data={["if", "red"]} />分岐)」です。
      <br />
      条件分岐は、<CodeSpan
        data={[
          ["if", "red"],
          [" ( ... )", "white"],
        ]}
      /> の括弧で囲まれた式の条件が成り立つ場合と、成り立たない場合で別の処理をすることができます。
      <br />
    </p>
    <hr class="cBorderLine" />
    <p>
      このプログラムでは、変数<CodeSpan data={["num", "white"]} /> が偶数か奇数かを判定しています。
      <br />
      <CodeSpan data={["%", "white"]} /> は割り算の余りを求める演算子で、
      <CodeSpan
        data={[
          ["num % ", "white"],
          ["2", "blue"],
        ]}
      /> は
      <CodeSpan data={["num", "white"]} /> を
      <CodeSpan data={["2", "blue"]} /> で割った余りを求めます。
      <br />
      偶数の場合、割り切れるので余りは <CodeSpan data={["0", "blue"]} /> になります。
      <br />
      実行して確かめてみましょう。 また、
      <CodeSpan data={["num", "white"]} /> を別の数値に変更して、正しく判定できるかどうか試してみましょう。
    </p>
    <hr class="cBorderLine" />
  </div>

  <div class="cResponsiveCodeExecuter">
    <CodeExecuter bind:this={codeExecuterRef} bind:codeExeProps {allowedGlobals} />
  </div>

  <div>
    <hr class="cBorderLine" />
    <p>
      <CodeSpan data={["===", "white"]} /> は等しいかどうかを判定する演算子で、「真偽値」を返します。
      <br />
      真偽値とは、「真(<CodeSpan data={["true", "blue"]} />)」または「偽(<CodeSpan
        data={["false", "blue"]}
      />)」のどちらかを取る、「真偽型(<CodeSpan data={["Boolean", "white"]} />)」の値です。
      <br />
      <CodeSpan
        data={[
          ["if", "red"],
          [" ( ... )", "white"],
        ]}
      /> の括弧で囲まれた部分の条件式が真となる場合に、続く
      <CodeSpan data={["{ ... }", "white"]} /> の中の処理が実行されます。
      <br />
      <CodeSpan
        data={[
          ["else ", "red"],
          ["{ ... }", "white"],
        ]}
      /> の中の処理は、条件式が偽となる場合に実行されます。
    </p>
    <hr class="cBorderLine" />
    <p>
      では、もし <CodeSpan
        data={[
          ["const ", "red"],
          ["num = ", "white"],
          ['"str"', "lightblue"],
        ]}
      /> としたら結果はどうなるでしょう？
      <br />
      文字列は、偶数でも奇数でもないはずですよね。なぜこの結果になるのか考えてみましょう。
    </p>
    <hr class="cBorderLine" />
  </div>
</div>
