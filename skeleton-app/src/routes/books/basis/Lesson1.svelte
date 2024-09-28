<script lang="ts">
  import type { AllowedGlobals } from "$lib/utils/safeEval";
  import type { CodeExeProps } from "$lib/types/props";
  import CodeSpan from "$lib/components/CodeSpan.svelte";
  import CodeExecuter from "$lib/components/CodeExecuter.svelte";

  const sampleCode = `const str = "Hello, World!";
log("log: " + str);
return str;`;

  let codeExecuterRef: CodeExecuter;
  let codeExeProps: CodeExeProps = {
    code: sampleCode,
    resultString: "",
    logs: [],
  };

  const allowedGlobals: AllowedGlobals = {};
</script>

<div class="max-w-[1000px]">
  <h2 class="cBookTitle">プログラムの基礎 Lesson1 : プログラムを実行してみよう！</h2>
  <div>
    <hr class="cBorderLine" />
    <p>
      画面左側の <span class="cIndexSpan">Code Editor</span> に書かれたプログラムを、 画面中央の
      <span class="cIconButtonStyle hover:!bg-green-800">Execute</span> ボタンを押して実行してみましょう。
    </p>
    <p>
      プログラムを実行すると、
      <CodeSpan data={["return", "red"]} /> が結果を出力します。 結果は、画面右側の
      <span class="cIndexSpan">Result</span> に表示されます。
    </p>
    <p>
      また、実行中に <CodeSpan
        data={[
          ["log", "purple"],
          ["()", "white"],
        ]}
      /> がログを出力します。 ログは、画面右側の
      <span class="cIndexSpan">logs</span> に表示されます。
    </p>
    <hr class="cBorderLine" />
  </div>

  <div class="cResponsiveCodeExecuter">
    <CodeExecuter bind:this={codeExecuterRef} bind:codeExeProps {allowedGlobals} />
  </div>

  <div>
    <hr class="cBorderLine" />
    <p>
      もちろん、プログラムは書き換えることができます。
      <br />
      例えば、このプログラムでは <CodeSpan
        data={[
          ["const ", "red"],
          ["str", "white"],
        ]}
      /> という変数に
      <CodeSpan data={["Hello, World!", "hljs-string"]} /> という文字列を代入しています。
      <br />
      もし、この文字列を書き換えてから実行したら、結果はどうなるでしょうか？
    </p>
    <hr class="cBorderLine" />
  </div>
</div>
