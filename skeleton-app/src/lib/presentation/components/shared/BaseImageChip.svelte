<script lang="ts">
  /**
   * 素質チップ＝ベースイメージ（系統×版）をアイコン＋タグで示す最小パーツ。
   *
   * イメージ行・観戦ビュー・セレクタトリガで使い回す。
   * 色・サイズ・濃淡は文脈（明地／暗地）で変わるので、呼び出し側がクラスで上書きする（CursorButton と同じ流儀）。
   */
  import Icon from "@iconify/svelte";
  import type { BaseImage } from "$lib/application";
  import { baseImageTag } from "$lib/presentation/utils/labels";

  interface BaseImageChipProps {
    base: BaseImage;
    // 全体に効くクラス（文脈ごとの text サイズ・色・shrink-0 など）。
    cRoot?: string;
    // アイコンのサイズ・色（明地=success-700／暗地=emerald-400 など）。
    cIcon?: string;
    // タグ文字のクラス。
    cTag?: string;
  }

  let {
    base,
    cRoot = "",
    cIcon = "size-3.5 text-success-700",
    cTag = "font-mono opacity-70",
  }: BaseImageChipProps = $props();
</script>

<span class="inline-flex items-center gap-1 {cRoot}" title="ベースイメージ（素質）">
  <Icon icon={base.icon} class={cIcon} />
  <span class={cTag}>{baseImageTag(base)}</span>
</span>
