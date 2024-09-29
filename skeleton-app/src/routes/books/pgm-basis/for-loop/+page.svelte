<script lang="ts">
  import type { AllowedGlobals } from "$lib/utils/safeEval";
  import type { CodeExeProps } from "$lib/types/props";
  import CodeSpan from "$lib/components/CodeSpan.svelte";
  import CodeExecuter from "$lib/components/CodeExecuter.svelte";

  const sampleCode = `let list = [];
for (let i = 1; i <= 10; i++) {
  log("loop: i = " + i);
  list = [...list, i];
}

return list;`;

  let codeExecuterRef: CodeExecuter;
  let codeExeProps: CodeExeProps = {
    code: sampleCode,
    resultString: "",
    logs: [],
  };

  const allowedGlobals: AllowedGlobals = {};
</script>

<div class="cBookContents">
  <h2 class="cLessonTitle">繰り返し(ループ)</h2>
  <div class="w-full">
    <hr class="cBorderLine" />
    <p>
      最後に紹介する強力なアイテムは「繰り返し(<CodeSpan data={["for", "red"]} />ループ)」です。
      <br />
      繰り返しは、<CodeSpan
        data={[
          ["for", "red"],
          [" ( ... )", "white"],
        ]}
      /> の括弧で囲まれた式に従い、同じ処理を繰り返し行うことができます。
    </p>
    <hr class="cBorderLine" />
    <p>
      このプログラムでは、1 から 10 までの数値を配列に格納しています。
      <br />
      括弧の中の初めの条件式 <CodeSpan
        data={[
          ["let ", "red"],
          ["i = ", "white"],
          ["1", "lightblue"],
          [";", "white"],
        ]}
      /> は、変数<CodeSpan data={["i", "white"]} /> が <CodeSpan data={["1", "blue"]} /> からスタートすることを示しています。
      <br />
      次の条件式 <CodeSpan
        data={[
          ["i <= ", "white"],
          ["10", "lightblue"],
          [";", "white"],
        ]}
      /> は、変数<CodeSpan data={["i", "white"]} /> が <CodeSpan data={["10", "blue"]} /> 以下である限り、繰り返し処理を続けることを示しています。
      <br />
      最後の条件式 <CodeSpan data={[["i++;", "white"]]} /> は、ループ毎に変数<CodeSpan data={["i", "white"]} /> の値を 1
      ずつ増やすことを示しています。
      <br />
      実行して、ループがどのように動くか見てみましょう。
    </p>
    <hr class="cBorderLine" />
  </div>
  <div class="cResponsiveCodeExecuter">
    <CodeExecuter bind:this={codeExecuterRef} bind:codeExeProps {allowedGlobals} />
  </div>

  <div class="w-full">
    <hr class="cBorderLine" />
    <p>
      初めに「同じ処理を繰り返す」と書きましたが、実際はこのプログラムのように変数を使って、
      <br />
      少しだけ異なる処理を複数回実行したいときに使うこともできます。
      <br />
      条件式やループ内の処理を書き換えて、繰り返しの回数や内容を変えてみましょう。思ったとおりに動きましたか？
    </p>
    <hr class="cBorderLine" />
  </div>
</div>
