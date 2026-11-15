<script lang="ts">
  // アイコン＋ラベルの塗りピル（角丸最大・枠線なし・淡い地色）＝非操作のタグ表示プリミティブ。
  // 枠付き矩形（ボタン/カード）と見分くため塗りバッジにする。ラベルの意味づけは呼び出し側が担う。
  import Icon from "@iconify/svelte";

  interface IconPillProps {
    icon: string;
    label: string;
    // ホバーで出す補足（アイコンだけでは曖昧な語を補う）。
    title?: string;
  }

  let { icon, label, title }: IconPillProps = $props();
</script>

<span
  class="inline-flex items-center gap-0.5 rounded-full bg-surface-100 px-2 py-0.5 font-mono text-xs tabular-nums text-surface-700"
  {title}
>
  <Icon {icon} class="size-3.5 text-success-700" aria-hidden="true" />
  {label}
</span>
