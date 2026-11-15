<script lang="ts">
  // 素質（系統×版）を「系統アイコン＋版タグ」の塗りピルで示す（例: 🐢 v1.0）。
  // 版だけの compact 表示（系統は icon で担保）。フルタグ（imageName:v版）が要る技術文脈は BaseImageChip を使う。
  import type { BaseImage } from "#lib/application";
  import { versionTag } from "#lib/presentation/utils/labels";
  import IconPill from "./IconPill.svelte";

  interface BaseImagePillProps {
    base: BaseImage;
  }

  let { base }: BaseImagePillProps = $props();
</script>

<IconPill icon={base.icon} label={versionTag(base)} title={base.family} />
