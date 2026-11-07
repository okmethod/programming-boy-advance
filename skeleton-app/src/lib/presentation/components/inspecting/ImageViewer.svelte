<script lang="ts">
  // オートマトンイメージの正体（ハッシュ-名前-時刻）を観戦列で見せる表示専用ビュー。
  // プログラム/ログと同じスロット（ビューワー右上トグルで切替）に置くダーク地パネル。
  //   Ally  = デプロイ済みイメージ（デプロイ時刻＋編集側の最新ビルドとズレたら「要再デプロイ」）
  //   Enemy = ステージ固定イメージ（時刻・ドリフト無し）
  // 両列で同じ体裁にして観戦ビューの左右対称を保つ。
  // ベースイメージ（素質）の情報もここに載せる（content-addressable の B面の芽＝何から作ったか）。
  import Icon from "@iconify/svelte";
  import { baseImageTag, type BaseImage } from "$lib/domain";

  interface ImageViewerProps {
    // 内容ハッシュ（content fingerprint）。null＝イメージ未確定（未デプロイ等）で空表示にする。
    hash: string | null;
    // 表示名（タグ）。
    name: string;
    // 土台にした素質（系統×版）。持たない対象では省略。
    baseImage?: BaseImage | null;
    // 確定時刻のラベル（デプロイ時刻）。持たない対象（ステージ固定の敵）は省略。
    timeLabel?: string | null;
    // 編集側の最新ビルドとズレているか＝「要再デプロイ」。Ally のみ。
    drift?: boolean;
    // 空表示（hash===null）の文言・アイコン。
    emptyLabel?: string;
    emptyIcon?: string;
    // 親の高さいっぱいに広げる（観戦列のフル高スロット）。既定は内容ぴったり。
    fill?: boolean;
  }

  let {
    hash,
    name,
    baseImage = null,
    timeLabel = null,
    drift = false,
    emptyLabel = "未デプロイ",
    emptyIcon = "mdi:cube-outline",
    fill = false,
  }: ImageViewerProps = $props();
</script>

<div class={fill ? "flex min-h-0 flex-1 flex-col" : ""}>
  <div class={fill ? "min-h-0 flex-1" : ""}>
    <div class="overflow-auto rounded bg-gray-900 p-3 text-gray-200 {fill ? 'h-full' : 'min-h-24'}">
      {#if hash === null}
        <!-- 空表示：プログラム/ログビューと見た目を揃える。 -->
        <div
          class="flex h-full min-h-24 flex-col items-center justify-center gap-1.5 p-4 text-center font-pixel text-gray-500"
        >
          <Icon icon={emptyIcon} class="size-6 opacity-40" />
          <span>{emptyLabel}</span>
        </div>
      {:else}
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <Icon icon="mdi:cube" class="size-5 shrink-0 text-gray-400" />
            <span class="truncate text-sm font-bold">{name}</span>
            {#if drift}
              <span
                class="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300"
                title="編集側の最新ビルドとズレています"
              >
                <Icon icon="mdi:sync-alert" class="size-3" /> 要再デプロイ
              </span>
            {/if}
          </div>
          <div class="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs text-gray-400">
            {#if baseImage}
              <!-- 素質＝何から作ったか（FROM）。 -->
              <span class="text-gray-500">base</span>
              <span class="inline-flex items-center gap-1" title="ベースイメージ（素質）">
                <Icon icon={baseImage.icon} class="size-3.5 text-emerald-400" />
                <span class="font-mono">{baseImageTag(baseImage)}</span>
              </span>
            {/if}
            <span class="text-gray-500">hash</span>
            <span class="font-mono">{hash}</span>
            {#if timeLabel}
              <span class="text-gray-500">timestamp</span>
              <span class="inline-flex items-center gap-1">
                <Icon icon="mdi:clock-outline" class="size-3.5" />{timeLabel}
              </span>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
