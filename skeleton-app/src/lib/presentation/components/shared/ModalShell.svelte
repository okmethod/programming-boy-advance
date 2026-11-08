<script lang="ts">
  // モーダルの外枠＝オーバーレイ＋背景バックドロップ＋白パネル＋ヘッダー（タイトル／閉じる）の共通器。
  // トリガ釦・開閉 state は呼び出し元が所有する（この器は open を受けて描くだけ）。
  // 器ごとに差が出るのはパネルのサイズ（panelClass）とタイトル／本体／任意フッターの中身のみ。
  import type { Snippet } from "svelte";
  import Icon from "@iconify/svelte";
  import { fade } from "svelte/transition";

  interface ModalShellProps {
    open: boolean;
    // ×／背景クリックで閉じるときのフック。
    onClose: () => void;
    // パネルのサイズ／レイアウトクラス（器ごとに差が出る唯一の軸）。呼び出し元で文字列リテラルで渡す。
    panelClass?: string;
    // ヘッダーのタイトル（アイコン＋文言）。器ごとに異なるため snippet で受ける。
    title: Snippet;
    // 本体。
    children: Snippet;
    // 任意フッター（確定釦など）。持たない器もある。
    footer?: Snippet;
  }

  let { open, onClose, panelClass = "", title, children, footer }: ModalShellProps = $props();
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center"
    transition:fade={{ duration: 150 }}
  >
    <button class="absolute inset-0 bg-black/40" aria-label="閉じる" onclick={onClose}></button>
    <div
      class="relative z-10 flex max-h-[80dvh] w-full flex-col gap-3 overflow-hidden rounded-xl bg-white p-4 shadow-xl {panelClass}"
    >
      <!-- ヘッダー：タイトル（中身は呼び出し元）＋閉じる釦（全器共通）。 -->
      <div class="flex shrink-0 items-center justify-between">
        <h2 class="inline-flex items-center gap-1 text-base font-bold">
          {@render title()}
        </h2>
        <button class="rounded p-1 hover:bg-gray-100" aria-label="閉じる" onclick={onClose}>
          <Icon icon="mdi:close" class="size-5" />
        </button>
      </div>
      {@render children()}
      {#if footer}
        {@render footer()}
      {/if}
    </div>
  </div>
{/if}
