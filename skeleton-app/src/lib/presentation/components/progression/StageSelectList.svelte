<script lang="ts">
  // ステージ選択の「中身」。host（モーダル／進行ページ）から器を差し替えて共通利用する。
  // chrome（モーダル枠／ページ枠）は持たず、一覧表示と選択だけに責務を絞る＝器を差し替えられる。
  import Icon from "@iconify/svelte";
  import { chapterList } from "#lib/presentation/composition";
  import { stageIcon } from "./stageIcon";

  interface StageSelectListProps {
    // 選択後に host（モーダル／ページ）が反応するためのフック（モーダルを閉じる・遷移する等）。
    onSelect?: (id: string) => void;
    // 現在選択中のステージ id（チェック表示用）。文脈が無ければ未指定＝無強調。
    selectedId?: string;
    // 省スペース表示。モーダル（狭い・クイック切替）向けに単列＋説明文なし＋番号なしへ畳む。
    // 既定（ページ＝入口）は 2 列＋説明文＋順序番号で見渡す。
    compact?: boolean;
  }

  let { onSelect, selectedId, compact = false }: StageSelectListProps = $props();

  function select(id: string) {
    onSelect?.(id);
  }
</script>

<!-- 章ごとにヘッダ＋カード群で並べる（Tier > Chapter > Stage の Chapter 区切り）。進行ページでも同じ器で並ぶ。
     TODO: アンロック状態・Tier 見出しは進行ルート導入時に足す。 -->
<div class="flex flex-col gap-5">
  {#each chapterList as chapter (chapter.id)}
    <section class="flex flex-col gap-2">
      <h2 class="flex items-center gap-1.5 text-sm font-bold opacity-80">
        <Icon icon="mdi:book-open-page-variant-outline" class="size-4" />
        {chapter.label}
      </h2>
      <ul class={compact ? "grid grid-cols-1 gap-2" : "grid grid-cols-1 gap-2 sm:grid-cols-2"}>
        {#each chapter.stages as s, i (s.id)}
          <li>
            <!-- レトロ緑モノクロのカーソルリスト。細枠＋内側パディングで隣カラムと干渉させない。
                 hover は ▶（＋下線）だけ。色変え（bg）は現在ステージの「今ここ」表示に充て、hover とは役割を分ける。 -->
            <button
              class="group flex h-full w-full flex-col gap-0.5 rounded border px-6 py-3 text-left text-surface-900 {selectedId ===
              s.id
                ? 'border-surface-900 bg-surface-100'
                : 'border-surface-300'}"
              onclick={() => select(s.id)}
            >
              <div class="relative flex items-center gap-2">
                <!-- 選択カーソル＝hover で現れる。絶対配置で左パディング内に逃がし、本文の左余白を作らない。 -->
                <span
                  class="pointer-events-none invisible absolute top-1/2 right-full mr-1 -translate-y-1/2 text-xs group-hover:visible"
                  >▶</span
                >
                <!-- file 系の状態グリフ（進行モデル未導入のため一律 "open"。現在ステージは塗りで表す）。 -->
                <Icon icon={stageIcon("open", selectedId === s.id)} class="size-4 shrink-0" />
                <span class="font-bold group-hover:underline">{s.label}</span>
                <!-- ラベルと番号の間の空き。リーダーは全幅に敷かず、番号の手前に短く右寄せで添える。 -->
                <span class="grow"></span>
                <span aria-hidden="true" class="shrink-0 select-none text-xs opacity-30">・・・・</span>
                <!-- 章内の順序番号（ページ番号メタファー）。器に依らず順序を担保する。 -->
                <span class="shrink-0 text-xs tabular-nums opacity-50">{i + 1}</span>
              </div>
              {#if !compact}
                <!-- goal は 2 行で高さ固定（h-10＝leading-5×2 行）。長短に依らずカード高さを揃える。ラベル位置へ字下げ。 -->
                <p class="line-clamp-2 h-10 pl-6 text-sm leading-5 opacity-70">{s.goal}</p>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</div>
