<script lang="ts">
  import CodeSpan from "$lib/components/CodeSpan.svelte";

  const pgmTerms = [
    { term: "コード", english: "Code", reading: "コード", description: "プログラムを記述するための命令や文の集まり" },
    {
      term: "エディター",
      english: "Editor",
      reading: "エディター",
      description: "コードを記述・編集するためのツール",
    },
    { term: "実行", english: "Execute", reading: "エグゼキュート", description: "プログラムを実行すること" },
    { term: "結果", english: "Result", reading: "リザルト", description: "プログラムを実行し、最後に返される値" },
    { term: "ログ", english: "Log", reading: "ログ", description: "プログラム実行中の情報の記録" },
    { term: "エラー", english: "Error", reading: "エラー", description: "プログラム実行中に発生した問題" },
    { term: "変数", english: "Variable", reading: "バリアブル", description: "データを格納する名前付きの箱" },
    { term: "let", english: "let", reading: "レット", description: "再代入可能な変数を宣言するためのキーワード" },
    {
      term: "const",
      english: "const",
      reading: "コンスト",
      description: "再代入不可能な変数を宣言するためのキーワード",
    },
    { term: "値", english: "Value", reading: "バリュー", description: "具体的なデータ" },
    { term: "代入", english: "Assignment", reading: "アサインメント", description: "変数に値を設定すること" },
    { term: "型", english: "Type", reading: "タイプ", description: "データの種類や形式" },
    { term: "文字列", english: "String", reading: "ストリング", description: "文字列を表すデータ型" },
    { term: "数値", english: "Number", reading: "ナンバー", description: "数値を表すデータ型" },
    {
      term: "真偽値",
      english: "Boolean",
      reading: "ブール",
      description: "真(true) または 偽(false) を表すデータ型",
    },
    { term: "配列", english: "Array", reading: "アレイ", description: "複数のデータを格納するデータ型" },
    { term: "配列", english: "List", reading: "リスト", description: "同上" },
    {
      term: "関数",
      english: "Function",
      reading: "ファンクション",
      description: "特定の処理をまとめておき、引数を入れたら戻り値を返す箱",
    },
    { term: "引数", english: "Argument", reading: "アーギュメント", description: "関数に渡される値" },
    { term: "Return", english: "Return", reading: "リターン", description: "関数が値を返すキーワード" },
    { term: "戻り値", english: "Return Value", reading: "リターンバリュー", description: "関数が返す値" },
    { term: "forループ", english: "for", reading: "フォー", description: "同じ処理を繰り返し実行する機構" },
    {
      term: "if分岐",
      english: "if",
      reading: "イフ",
      description: "特定の条件が成り立つ場合に別のコードを実行する機構",
    },
    {
      term: "else",
      english: "else",
      reading: "エスル",
      description: "特定の条件が成り立たない場合に別のコードを実行する機構",
    },
    {
      term: "式",
      english: "Expression",
      reading: "エクスプレッション",
      description: "評価することで値を求められるコード",
    },
    {
      term: "条件",
      english: "Condition",
      reading: "コンディション",
      description: "ifやforなどの条件を表現する式",
    },
    { term: "演算子", english: "Operator", reading: "オペレーター", description: "値を操作するための記号やキーワード" },
  ];
</script>

<div class="cBookContents">
  <h2 class="cLessonTitle">よく使うプログラムの用語集</h2>
  <hr class="cBorderLine" />

  <div>
    <table class="min-w-full">
      <thead class="border-b border-gray-800">
        <tr>
          <th class="py-2 px-4">用語</th>
          <th class="py-2 px-4">英単語</th>
          <th class="py-2 px-4">読み方</th>
          <th class="py-2 px-4">説明</th>
        </tr>
      </thead>
      <tbody class="">
        {#each pgmTerms as { term, english, reading, description }}
          <tr>
            <td class="py-2 px-4 border-b border-gray-400">{term}</td>
            <td class="py-2 px-4 border-b border-gray-400"><CodeSpan data={[english, "white"]} /></td>
            <td class="py-2 px-4 border-b border-gray-400">{reading}</td>
            <td class="py-2 px-4 border-b border-gray-400">{description}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
