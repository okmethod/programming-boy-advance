<script lang="ts">
  import type { AllowedGlobals } from "$lib/utils/safeEval";
  import type { CodeExeProps } from "$lib/types/props";
  import CodeSpan from "$lib/components/CodeSpan.svelte";
  import CodeExecuter from "$lib/components/CodeExecuter.svelte";

  const sampleCode = `const l = [2, 4, 6];
log("list: " + l);
log("[0]: " + l[0]);
log("[1]+[2]: " + (l[1] + l[2]));
log("list len: " + l.length);

const linl = [l, [8, 10]]
log("linl[0]: " + linl[0]);
log("linl[0][0]: " + linl[0][0]);
log("linl[1][0]: " + linl[1][0]);
log("linl len: " + linl.length);
return linl;`;

  let codeExecuterRef: CodeExecuter;
  let codeExeProps: CodeExeProps = {
    code: sampleCode,
    resultString: "",
    logs: [],
  };

  const allowedGlobals: AllowedGlobals = {};
</script>

<div class="max-w-[1000px]">
  <h2 class="cBookTitle">Book4 : データの配列</h2>
  <div>
    <hr class="cBorderLine" />
    <p>
      「数値型」「文字列型」とは別のデータ型として、「配列(<CodeSpan
        data={["Array", "white"]}
      />)型」というものがあります。
      <br />
      配列は複数のデータを一つの変数にまとめて保存するためのもので、括弧<CodeSpan data={["[]", "white"]} />
      とカンマ<CodeSpan data={[",", "white"]} /> を使って定義します。
      <br />
      「リスト」とよばれることもあります。
    </p>
    <hr class="cBorderLine" />
    <p>
      配列に含まれるそれぞれのデータを「要素」とよび、要素は左から 0番, 1番, 2番, ... と番号がついています。
      <br />
      配列の要素を使うには、<CodeSpan
        data={[
          ["list[", "white"],
          ["0", "blue"],
          ["]", "white"],
        ]}
      /> のように配列名に括弧をつけて番号を指定します。
      <br />
      また、<CodeSpan data={["list.length", "white"]} /> のように書くことで、配列のなかにいくつ要素があるか確認することもできます。
      <br />
      このプログラムを実行して、配列とその中の要素を表示できるか確認してみましょう。
    </p>
    <hr class="cBorderLine" />
  </div>

  <div class="cResponsiveCodeExecuter">
    <CodeExecuter bind:this={codeExecuterRef} bind:codeExeProps {allowedGlobals} />
  </div>

  <div>
    <hr class="cBorderLine" />
    <p>配列は、数値型のデータだけでなく、様々な型のデータを要素として入れることができます。</p>
    <hr class="cBorderLine" />
    <p>
      少し複雑ですが、配列のなかに配列を入れることもできます。
      <br />
      変数<CodeSpan data={["linl", "white"]} /> は配列の中に 2つの配列が入っており、要素数は 2 です。
      <br />
      <CodeSpan data={["linl[0]", "white"]} /> は配列の中の最初の要素で、
      <CodeSpan data={["linl[0][0]", "white"]} /> はその中の最初の要素です。
    </p>
    <hr class="cBorderLine" />
    <p>
      また、2つの配列から、それぞれの要素を含む1つの配列を作りたい場合は <CodeSpan data={["...", "white"]} /> を使って配列を展開します。
      <br />
      変数<CodeSpan data={["linl", "white"]} /> に代入する部分を
      <CodeSpan
        data={[
          ["[...l, ...[", "white"],
          ["8, 10", "blue"],
          ["]", "white"],
        ]}
      /> のように書き換えて実行してみましょう。
      <br />
      結果はどう変わりましたか？
    </p>
    <hr class="cBorderLine" />
  </div>
</div>
