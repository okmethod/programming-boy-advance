<script lang="ts">
  /**
   * 「分子/分母」の計器表示（HP・BP・CP など現在値/最大値）。
   *
   * 桁数が変わってもスラッシュ位置がぶれないよう、両数字を固定幅（既定2桁ぶん）で右揃えする。
   * 色・サイズ・濃淡は呼び出し側がクラスで上書きする（CursorButton と同じ流儀）。
   */
  interface FractionReadoutProps {
    numerator: number | string;
    denominator: number | string;
    // 数字1つぶんの固定幅。3桁以上を扱うなら "w-[3ch]" などに上書きする。
    width?: string;
    // 全体に効くクラス（危険時の赤など）。
    cRoot?: string;
    // 分子・スラッシュ・分母それぞれのサイズ・濃淡。
    cNumerator?: string;
    cSlash?: string;
    cDenominator?: string;
  }

  let {
    numerator,
    denominator,
    width = "w-[2ch]",
    cRoot = "",
    cNumerator = "",
    cSlash = "",
    cDenominator = "",
  }: FractionReadoutProps = $props();
</script>

<span class="inline-flex shrink-0 items-baseline tabular-nums {cRoot}">
  <span class="{width} text-right {cNumerator}">{numerator}</span>
  <span class={cSlash}>/</span>
  <span class="{width} text-right {cDenominator}">{denominator}</span>
</span>
