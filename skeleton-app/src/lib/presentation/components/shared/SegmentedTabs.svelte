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
  }

  let { value, items, onChange }: SegmentedTabsProps = $props();
</script>

<SegmentedControl class="inline-flex" {value} onValueChange={(d) => d.value && onChange(d.value)}>
  <SegmentedControl.Control
    class="relative inline-flex items-center gap-0.5 rounded-lg border border-surface-300 bg-surface-100 p-0.5"
  >
    <!-- 選択中の下敷き。非選択（淡い group 地 surface-100）より濃い surface-300 で「選択＝濃い背景」を示す。
         位置・幅は zag が inline style で与えるので、ここは見た目だけ。
         z-0 で文字（z-10）の背面に回し、選択セグメントのラベルが隠れないようにする。 -->
    <SegmentedControl.Indicator class="z-0 rounded bg-surface-300 shadow-sm" />
    {#each items as item (item.value)}
      <!-- 文字色は選択/非選択で共通（surface-900）。
           状態差は背景の濃淡（下敷き）だけで表し、反転させない。
           色は ItemText に明示して、選択状態で別色に上書きされないようにする。 -->
      <SegmentedControl.Item
        value={item.value}
        class="relative z-10 inline-flex cursor-pointer items-center gap-1 rounded px-3 py-1 text-sm transition select-none"
      >
        <SegmentedControl.ItemText class="inline-flex items-center gap-1 text-surface-900">
          <Icon icon={item.icon} class="size-4" />
          {item.label}
        </SegmentedControl.ItemText>
        <SegmentedControl.ItemHiddenInput />
      </SegmentedControl.Item>
    {/each}
  </SegmentedControl.Control>
</SegmentedControl>
