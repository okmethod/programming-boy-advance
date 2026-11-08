<script lang="ts">
  // ベースイメージ（素質＝系統×版）のセレクタ。閉＝現在の素質チップ釦／開＝2軸カタログで解放内容を見て選び直す。
  // 「どちらを選ぶと何が解放されるか」を見てから決めるための器。2軸でカタログを写す:
  //   左＝系統リスト（増える＝行が増える）／右＝選んだ系統の版ラダー（伸びる＝ノードが増える）。
  // 各版カードは「できること」の一言概要で版の違いを示し、下段に解放ブロックのフルリスト（コマンド/クエリ/制御）を出す。
  // 系統が増え・版が伸びても同じレイアウトのまま拡張できる。
  // 現在値（適用中の素質）と編集中プログラムは workbenchDraft を直接購読し、確定は workbenchFacade.setBaseImage で行う。
  import Icon from "@iconify/svelte";
  import {
    baseImageFamilies,
    baseImageTag,
    versionTag,
    baseImageSupports,
    workbenchDraft,
    workbenchFacade,
    type BaseImage,
  } from "$lib/application";
  import { commandLabel, sensorLabel, controlLabel } from "$lib/presentation/utils/labels";
  import BaseImageChip from "$lib/presentation/components/shared/BaseImageChip.svelte";
  import ModalShell from "$lib/presentation/components/shared/ModalShell.svelte";

  interface BaseImageSelectorProps {
    // 非互換（使用中ブロックが残ると不整合）な切替のとき、編集中プログラムを空にする。
    // Blockly が編集の SSoT なので実際の load([]) は親に委ねる（破棄の同意はこの中の確認で取得済み）。
    onClear: () => void;
  }

  let { onClear }: BaseImageSelectorProps = $props();

  // 現在適用中の素質・編集中プログラムはドラフトを直接購読する（プレビュー初期値／互換性ガードの材料）。
  const draft = $derived($workbenchDraft);

  // 開閉状態（このセレクタが所有）。トリガで開き、確定／閉じるで閉じる。
  let open = $state(false);

  const families = baseImageFamilies();

  // プレビュー中の版（＝選択候補・下段の解放リストとラダーの強調対象）。
  // 既定は適用中（draft.baseImage）。開いた後にブラウズした分だけ override で上書きし、開くたび override を消す。
  let override = $state<BaseImage | null>(null);
  const focused = $derived(override ?? draft.baseImage);
  // 非互換切替の確認中フラグ（フッターを確認文に差し替える）。候補が変われば解除。
  let confirming = $state(false);
  $effect(() => {
    if (open) override = null;
  });

  // プレビュー中の版が属する系統（版ラダーの描画元）。
  const focusedFamily = $derived(families.find((f) => f.imageName === focused.imageName) ?? families[0]);

  // 候補が現適用と同じか＝切替不要（ボタン無効）。
  const isCurrent = $derived(baseImageTag(focused) === baseImageTag(draft.baseImage));
  // 候補へ切り替えても使用中ブロックが失われないか（互換性ガード）。
  const supported = $derived(baseImageSupports(focused, draft.program));

  // 候補を切り替える。確認中フラグは候補が変わったら必ず解除する。
  function pick(base: BaseImage) {
    override = base;
    confirming = false;
  }
  // 系統を切り替える＝その系統の最新版（開花が最も進んだ版）を候補にする。
  function focusFamily(imageName: string) {
    const fam = families.find((f) => f.imageName === imageName);
    if (fam) pick(fam.versions[fam.versions.length - 1]);
  }

  // 候補を確定して素質を乗り換える。非互換は編集を空に（親へ委譲）してから適用する。
  function commit() {
    if (!supported) onClear();
    workbenchFacade.setBaseImage(focused);
    open = false;
  }
  // 確定ボタン。互換なら即適用。非互換は一度確認を挟み、OK でプログラム破棄込みの切替を行う。
  function apply() {
    if (supported) commit();
    else if (!confirming) confirming = true;
    else commit();
  }
</script>

<!-- トリガ＝現在のベースイメージ（系統アイコン＋タグ）。押すと2軸カタログで解放内容を見て選び直せる。 -->
<button
  type="button"
  onclick={() => (open = true)}
  class="inline-flex items-center gap-1.5 rounded border border-surface-300 bg-surface-50/95 px-2 py-1 text-xs text-surface-700 shadow-sm hover:bg-surface-100"
  title="ベースイメージ（素質）を選ぶ"
>
  <BaseImageChip base={draft.baseImage} cIcon="size-4 text-success-700" />
  <Icon icon="mdi:chevron-down" class="size-4 opacity-50" />
</button>

<!-- 高さは固定（panelClass=h-[32rem]／小画面は 80dvh で頭打ち）。版を切替えても解放リストの量でモーダルが
     伸縮しないよう、器の高さを一定にして内側リストだけスクロールさせる。 -->
<ModalShell {open} onClose={() => (open = false)} panelClass="h-[32rem] max-w-3xl">
  {#snippet title()}
    <Icon icon="mdi:dna" class="size-5 text-success-700" /> ベースイメージを選ぶ
  {/snippet}

  <!-- 本体（2軸）：左＝系統リスト／右＝版ラダー＋解放命令。狭幅では縦積み。 -->
  <div class="flex min-h-0 flex-1 flex-col gap-3 sm:flex-row">
    <!-- 左：系統リスト（縦に増える）。アイコン＋JP系統名＋EN識別子で「どの動物か」を同定。 -->
    <ul
      class="flex shrink-0 flex-row gap-1 overflow-x-auto sm:w-48 sm:flex-col sm:overflow-x-visible sm:overflow-y-auto"
    >
      {#each families as fam (fam.imageName)}
        <li>
          <button
            type="button"
            onclick={() => focusFamily(fam.imageName)}
            class="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-gray-100 {fam.imageName ===
            focused.imageName
              ? 'bg-success-100 font-bold'
              : ''}"
          >
            <Icon icon={fam.icon} class="size-5 shrink-0 text-success-700" />
            <span class="min-w-0">
              <span class="block truncate">{fam.family}</span>
              <span class="block truncate font-mono text-xs opacity-50">{fam.imageName}</span>
            </span>
          </button>
        </li>
      {/each}
    </ul>

    <!-- 右：選んだ系統の版ラダー＋解放コマンドリスト。 -->
    <div
      class="flex min-h-0 flex-1 flex-col gap-3 border-t border-gray-200 pt-3 sm:border-l sm:border-t-0 sm:pt-0 sm:pl-3"
    >
      <!-- 版ラダー：左から右へ開花の進行。前版との間に矢印を入れて「上げると広がる」を示す。
               選択＝ラジオ的に候補を1つ（枠で強調）。現適用には控えめに「使用中」を添えて基準点を示す。
               実際の切替はフッターのボタンが担う（選択と確定を分離）。 -->
      <div class="flex shrink-0 items-stretch gap-2 overflow-x-auto pb-1">
        {#each focusedFamily.versions as ver, i (baseImageTag(ver))}
          {#if i > 0}
            <div class="flex shrink-0 items-center text-gray-300">
              <Icon icon="mdi:chevron-right" class="size-5" />
            </div>
          {/if}
          <!-- 一致判定はタグ（値）で行う。$state はオブジェクトを Proxy 化するため参照比較は当てにならない。 -->
          {@const isFocused = baseImageTag(ver) === baseImageTag(focused)}
          {@const isApplied = baseImageTag(ver) === baseImageTag(draft.baseImage)}
          <!-- タイルは版番号＋状態だけに絞る（説明は下の説明欄に集約）。
                   固定幅＋左詰めで「使用中」の有無に依らず全タイルの幅を揃える。
                   候補（選択中）は色をかえる。 -->
          <button
            type="button"
            onclick={() => pick(ver)}
            class="flex w-32 shrink-0 items-center gap-2 rounded-lg border-1 px-3 py-2 text-left text-xs {isFocused
              ? 'border-success-200 bg-success-100'
              : 'border-gray-200 hover:bg-gray-50'}"
          >
            <span class="font-mono text-sm font-bold">{versionTag(ver)}</span>
            <!-- 現適用の基準点＝控えめなグレーのバッジ。候補強調は枠で表すので色は重ねない。 -->
            {#if isApplied}
              <span class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">使用中</span>
            {/if}
          </button>
        {/each}
      </div>

      <!-- 説明欄＝プレビュー中の版の「できること」を一言で（版タイルから外に出して集約）。 -->
      <p class="shrink-0 text-sm text-gray-600">> {focused.summary}</p>

      <!-- 解放ブロック一覧（プレビュー中の版）：コマンド／クエリ／制御をカテゴリ別に A面語で並べる。
               見出しは Blockly パレットのタブ名（コマンド/クエリ/制御）に揃える。未解放は「無し」。 -->
      <div class="flex min-h-0 flex-1 flex-col gap-2">
        <span class="shrink-0 text-xs font-bold text-gray-500">使えるブロック</span>
        <div class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-lg bg-gray-50 p-3 text-sm">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-bold text-gray-500">コマンド</span>
            {#if focused.commands.length > 0}
              <div class="flex flex-wrap gap-1.5">
                {#each focused.commands as cmd (cmd)}
                  <span class="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs">{commandLabel(cmd)}</span>
                {/each}
              </div>
            {:else}
              <!-- チップと同じ box 高さ（border-transparent+同 padding）にして、有無で行高がぶれないようにする。 -->
              <span class="inline-block w-fit rounded border border-transparent px-1.5 py-0.5 text-xs text-gray-400"
                >無し</span
              >
            {/if}
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-bold text-gray-500">クエリ</span>
            {#if focused.queries.length > 0}
              <div class="flex flex-wrap gap-1.5">
                {#each focused.queries as q (q)}
                  <span class="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs">{sensorLabel(q)}</span>
                {/each}
              </div>
            {:else}
              <!-- チップと同じ box 高さ（border-transparent+同 padding）にして、有無で行高がぶれないようにする。 -->
              <span class="inline-block w-fit rounded border border-transparent px-1.5 py-0.5 text-xs text-gray-400"
                >無し</span
              >
            {/if}
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-bold text-gray-500">制御</span>
            {#if focused.controls.length > 0}
              <div class="flex flex-wrap gap-1.5">
                {#each focused.controls as c (c)}
                  <span class="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs">{controlLabel(c)}</span>
                {/each}
              </div>
            {:else}
              <!-- チップと同じ box 高さ（border-transparent+同 padding）にして、有無で行高がぶれないようにする。 -->
              <span class="inline-block w-fit rounded border border-transparent px-1.5 py-0.5 text-xs text-gray-400"
                >無し</span
              >
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- フッター：選択（候補）を確定して切り替える単一ボタン。状態で意味が変わる（選択と確定を分離した標準パターン）。
       現適用と同じ＝無効「使用中」／互換＝「v◯ に切り替える」／非互換＝警告ボタン→確認を挟んでプログラム破棄込み切替。 -->
  {#snippet footer()}
    <div class="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 pt-3">
      {#if confirming}
        <!-- 非互換の確認：使用中ブロックが失われるため、プログラム破棄の同意を取る。
               メッセージ側で幅を吸収し、ボタンは折り返さない（shrink-0 + nowrap）。 -->
        <span class="mr-auto inline-flex min-w-0 items-start gap-1 text-sm text-error-700">
          <Icon icon="mdi:alert" class="mt-0.5 size-4 shrink-0" />
          <span>互換性がないため<wbr />プログラムが破棄されます。よろしいですか？</span>
        </span>
        <button class="action-btn shrink-0 whitespace-nowrap" onclick={() => (confirming = false)}>キャンセル</button>
        <button class="action-btn-strong shrink-0 whitespace-nowrap" onclick={apply}>
          <Icon icon="mdi:delete-alert" class="size-4" /> 破棄して切替
        </button>
      {:else}
        <button class="action-btn shrink-0 whitespace-nowrap" onclick={() => (open = false)}>閉じる</button>
        {#if isCurrent}
          <!-- 現適用と同じ＝切替不要。押せない状態で「今これが使われている」ことを示す。 -->
          <button class="action-btn-strong shrink-0 whitespace-nowrap disabled:opacity-40" disabled>
            <Icon icon="mdi:check" class="size-4" /> 使用中
          </button>
        {:else if supported}
          <button class="action-btn-strong shrink-0 whitespace-nowrap" onclick={apply}>
            <Icon icon="mdi:swap-horizontal" class="size-4" />
            {versionTag(focused)} に切り替える
          </button>
        {:else}
          <!-- 非互換＝使えなくなるブロックがある。警告色で示し、押すと確認（上の confirming）へ。 -->
          <button
            class="action-btn-strong shrink-0 whitespace-nowrap"
            onclick={apply}
            title="使用中のブロックが使えなくなります"
          >
            <Icon icon="mdi:alert" class="size-4" />
            {versionTag(focused)} に切り替える
          </button>
        {/if}
      {/if}
    </div>
  {/snippet}
</ModalShell>
