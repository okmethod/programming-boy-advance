<script lang="ts">
  // ビュー切替タブ＝副作用のないナビゲーション。
  // 命令ボタン（action-btn: デプロイ/プッシュ/閉じる）とは質が違うため、
  // 塗りのボタンではなく Skeleton の SegmentedControl（連結トグル）で表す。
  // 選択中はスライドする Indicator（淡色＋影）で「今どの面か」を示す。
  // retro 配色はここに集約し、複数のタブ群（構築エリア／参照レール）で同じ見た目を担保する。
  import { SegmentedControl } from "@skeletonlabs/skeleton-svelte";
  import Icon from "@iconify/svelte";

  interface TabItem {
    // 切替値。親の表示状態（$state）の取りうる値と対応する。
    value: string;
    // 見出しアイコン（Iconify 名）。
    icon: string;
    // 表示ラベル。
    label: string;
  }

  interface SegmentedTabsProps {
    // 選択中の値（SSoT は親の $state）。
    value: string;
    // 並べるタブ（左→右）。
    items: TabItem[];
    // 選択変更。親の union 型へは呼び出し側でキャストして戻す。
    onChange: (value: string) => void;
    // スリム表示（余白・文字を詰める）。狭いカラムの見出しタブで使う。
    dense?: boolean;
    // ダーク配色（黒パネルに溶け込む見出しタブ用）。既定は retro 淡色。
    dark?: boolean;
  }

  let { value, items, onChange, dense = false, dark = false }: SegmentedTabsProps = $props();
</script>

<SegmentedControl class="inline-flex" {value} onValueChange={(d) => d.value && onChange(d.value)}>
  <SegmentedControl.Control
    class="relative inline-flex items-center gap-0.5 rounded-lg border p-0.5 {dark
      ? 'border-gray-700 bg-gray-800'
      : 'border-surface-300 bg-surface-100'}"
  >
    <!-- 選択中の下敷き。非選択の group 地より一段明るい（dark）／濃い（light）色で「選択＝別の背景」を示す。
         位置・幅は zag が inline style で与えるので、ここは見た目だけ。
         z-0 で文字（z-10）の背面に回し、選択セグメントのラベルが隠れないようにする。 -->
    <SegmentedControl.Indicator class="z-0 rounded shadow-sm {dark ? 'bg-gray-600' : 'bg-surface-300'}" />
    {#each items as item (item.value)}
      <!-- 文字色は選択/非選択で共通。状態差は背景（下敷き）だけで表し、反転させない。
           色は ItemText に明示して、選択状態で別色に上書きされないようにする。 -->
      <SegmentedControl.Item
        value={item.value}
        class="relative z-10 inline-flex cursor-pointer items-center gap-1 rounded transition select-none {dense
          ? 'px-2 py-0.5 text-xs'
          : 'px-3 py-1 text-sm'}"
      >
        <SegmentedControl.ItemText class="inline-flex items-center gap-1 {dark ? 'text-gray-200' : 'text-surface-900'}">
          <Icon icon={item.icon} class={dense ? "size-3.5" : "size-4"} />
          {item.label}
        </SegmentedControl.ItemText>
        <SegmentedControl.ItemHiddenInput />
      </SegmentedControl.Item>
    {/each}
  </SegmentedControl.Control>
</SegmentedControl>
