<script lang="ts">
  // ステージカタログ＝選択 UI の「中身」。host（モーダル／進行ページ）から器を差し替えて共通利用する。
  // chrome（モーダル枠／ページ枠）は持たず、章ごとのステージ一覧表示と選択だけに責務を絞る＝器を差し替えられる。
  //
  // 章が増えても縦に伸びないよう、章はカルーセルで横に並べ、上段のセグメントタブで切替える。
  // 1 スライド＝1 章。章内ステージはスライド内でスクロールするため、全体の高さは章数に依らず host 内に収まる。
  // スワイプでも章を移動できる（iPad 想定）。タブの idle/active 配色は app.css の action-btn と揃える。
  import Icon from "@iconify/svelte";
  import { Carousel } from "@skeletonlabs/skeleton-svelte";
  import { chapterList } from "#lib/presentation/composition";
  import type { Chapter } from "#lib/application";
  import MemoryPill from "#lib/presentation/components/shared/MemoryPill.svelte";
  import BaseImagePill from "#lib/presentation/components/shared/BaseImagePill.svelte";
  import { stageIcon } from "./stageIcon";

  interface StageCatalogProps {
    // 選択後に host（モーダル／ページ）が反応するためのフック（モーダルを閉じる・遷移する等）。
    onSelect?: (id: string) => void;
    // 現在選択中のステージ id（チェック表示用）。文脈が無ければ未指定＝無強調。
    selectedId?: string;
    // 省スペース表示。モーダル（狭い・クイック切替）向けに単列＋説明文なし＋番号なしへ簡略化する。
    // 既定（ページ＝入口）は 2 列＋説明文＋順序番号で見渡す。
    compact?: boolean;
  }

  let { onSelect, selectedId, compact = false }: StageCatalogProps = $props();

  function select(id: string) {
    onSelect?.(id);
  }

  // 現在ステージを含む章を初期表示にする（プレイ面から開いたとき、その章から始める）。
  const initialPage = $derived(
    Math.max(
      0,
      chapterList.findIndex((c) => c.stages.some((s) => s.id === selectedId)),
    ),
  );
</script>

<!-- 1 章ぶんのステージ一覧（スライドの中身）。器に依らず同じ並びで描く。 -->
{#snippet chapterPanel(chapter: Chapter)}
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
            <!-- 持ち分ピル＝入場前に制約（メモリ・使える版）を予告する。goal と同じ字下げで添える。
                 allowedImages 未指定＝無制限はデフォルト状態なので版ピルを出さない（メモリのみ）。 -->
            <div class="flex flex-wrap items-center gap-1.5 pl-6">
              <MemoryPill memoryTotal={s.memoryTotal} memoryGrain={s.memoryGrain} />
              {#each s.allowedImages ?? [] as img (img.imageName + img.version)}
                <BaseImagePill base={img} />
              {/each}
            </div>
          {/if}
        </button>
      </li>
    {/each}
  </ul>
{/snippet}

<!-- Tier > Chapter > Stage の Chapter 区切りをカルーセルのページに割り当てる。
     TODO: アンロック状態・Tier 見出しは進行ルート導入時に足す。 -->
<Carousel
  slideCount={chapterList.length}
  slidesPerPage={1}
  defaultPage={initialPage}
  allowMouseDrag
  class="flex h-full min-h-0 flex-col gap-3"
>
  <!-- セグメントタブ＝章の切替。章数ぶん横に並べ、溢れたら横スクロール。
       Zag 標準の Indicator（ドット）ではなく、現在ページを読んで scrollTo で移動する自前タブにし、
       配色を app.css の action-btn（idle）/ action-btn-strong（active＝濃緑塗り）に揃える。 -->
  <Carousel.Context>
    {#snippet children(carousel)}
      <div class="flex shrink-0 gap-1.5 overflow-x-auto pb-1">
        {#each chapterList as chapter, i (chapter.id)}
          <button
            class={carousel().page === i
              ? "action-btn-strong shrink-0 whitespace-nowrap"
              : "action-btn shrink-0 whitespace-nowrap"}
            onclick={() => carousel().scrollTo(i)}
          >
            <Icon icon="mdi:book-open-page-variant-outline" class="size-4 shrink-0" />
            {chapter.label}
          </button>
        {/each}
      </div>
    {/snippet}
  </Carousel.Context>

  <Carousel.ItemGroup class="min-h-0 flex-1">
    {#each chapterList as chapter, i (chapter.id)}
      <Carousel.Item index={i} class="h-full min-h-0 overflow-y-auto p-0.5">
        {@render chapterPanel(chapter)}
      </Carousel.Item>
    {/each}
  </Carousel.ItemGroup>
</Carousel>
