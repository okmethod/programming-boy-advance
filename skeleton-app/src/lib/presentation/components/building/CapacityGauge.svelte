<script lang="ts">
  // CP（キャパシティ）ゲージ＋メモリ配分（HP↔CP）操作をまとめた編集チップ。
  // CP は戦闘には登場しない作成予算（docs/design/ui-screen-design.md）。HP（ヒープ）と同じメモリのメタファーなので
  // バーの見た目も HP バーに揃える。色は作成予算＝黄色系、超過＝赤。
  // メモリ配分：総メモリ(memoryTotal)を CP と HP に振り分け、CP 側の割り当て(cpAllocated)がバーの上限になる。
  //   射程は「見た目＋CP 上限」まで＝HP 側は表示のみで戦闘には未配線（[[sotai-baseimage-plan]] Phase 3 で実挙動を配線）。
  //   読み取り専用の CP 表示が要るようになったら editable prop を足し、必要なら配分状態を親へ lift する（YAGNI）。
  import { untrack } from "svelte";
  import Icon from "@iconify/svelte";

  interface CapacityGaugeProps {
    // 現在のプログラムが消費する CP（組んだブロック数）。
    cpUsed: number;
    // 総メモリ＝HP↔CP 配分の原資（プレイ面=stage.capacity／レジストリ管理=既定容量）。
    memoryTotal: number;
  }

  let { cpUsed, memoryTotal }: CapacityGaugeProps = $props();

  // 確定済みの CP 割り当て＝バーの上限。既定は全量 CP＝従来挙動（CP 上限＝総メモリ）を保つ。
  // untrack＝総メモリの現在値で初期シードするだけで以後は追従しない（配分はユーザー編集に委ねる）意図を明示。
  let cpAllocated = $state(untrack(() => memoryTotal));
  const over = $derived(cpUsed > cpAllocated);
  // 上限を超えた分も見えるよう、表示セグメント数は消費と割り当ての大きい方に合わせる。
  const segments = $derived(Math.max(cpAllocated, cpUsed));

  // 配分パネルの開閉と、スライダが触る下書き値。決定するまでゲージ（cpAllocated）には反映しない。
  let open = $state(false);
  let draft = $state(untrack(() => cpAllocated));

  // 開くたびに確定値から下書きを採り直す（前回のキャンセル分を引きずらない）。
  function openAllocation() {
    draft = cpAllocated;
    open = true;
  }
  // 決定＝下書きを確定値へ反映してゲージに効かせる。
  function commitAllocation() {
    cpAllocated = draft;
    open = false;
  }
</script>

<!-- 淡色チップ：エディタ編集面の暗地でも読めるよう半透明の明地に載せる。配分パネルは浮かせず同じチップ内に罫線で仕切る。 -->
<div class="rounded border border-surface-300 bg-surface-50/95 px-2 py-0.5 shadow-sm">
  <!-- 上段：CP ゲージ＋配分トグル（歯車）。 -->
  <div class="flex items-center gap-1.5">
    <div class="flex items-center gap-2">
      <span class="shrink-0 text-xs font-bold text-surface-500">CP</span>
      <!-- 等幅セグメント。明るい（surface）背景で読めるよう、溝=surface-300／未消費=surface-50。
           消費=アンバー・超過=赤は作成予算/超過の意味色として視認性優先で残す。 -->
      <div class="flex h-7 w-44 shrink-0 items-stretch gap-0.5 rounded-sm bg-surface-300 p-1">
        {#each Array(segments) as _, i (i)}
          <span class="flex-1 {i >= cpAllocated ? 'bg-red-500' : i < cpUsed ? 'bg-amber-300' : 'bg-surface-50'}"></span>
        {/each}
      </div>
      <span class="inline-flex shrink-0 items-baseline tabular-nums {over ? 'text-red-600' : 'text-surface-900'}">
        <span class="text-sm font-bold">{cpUsed}</span>
        <span class="px-0.5 text-xs text-surface-400">/</span>
        <span class="text-xs text-surface-500">{cpAllocated}</span>
      </span>
      {#if over}
        <span class="shrink-0 text-xs font-bold text-red-600">上限オーバー</span>
      {/if}
    </div>
    <!-- メモリ配分（HP↔CP）＝ビルド時の新ギミック其の二。CP 側の割り当てがこの CP ゲージの上限になる
         （BP は CPU＝ステージ固定なので対象外＝3 分割ではない）。CP の予算そのものに紐づくのでゲージの真横に置く。 -->
    <button
      type="button"
      class="inline-flex items-center rounded p-0.5 text-surface-600 hover:bg-surface-200"
      title="メモリ配分（HP↔CP）"
      onclick={() => (open ? (open = false) : openAllocation())}
    >
      <Icon icon="mdi:cog-outline" class="size-4" aria-label="メモリ配分" />
    </button>
  </div>

  {#if open}
    <!-- 下段：同じチップ内で罫線 1 本仕切るだけ（浮遊パネルにしない）。即時反映せずキャンセル/決定で確定する。 -->
    <div class="mt-1.5 border-t border-surface-300 pt-1.5 text-xs">
      <div class="mb-2 font-bold text-surface-700">メモリ配分</div>
      <!-- 総メモリを CP と HP に振り分ける。CP 厚め＝複雑なプログラム／HP 厚め＝打たれ強い（トレードオフ）。 -->
      <div class="mb-1.5 flex items-baseline justify-between tabular-nums">
        <span class="font-bold text-amber-600">CP {draft}</span>
        <span class="text-surface-400">/ 総 {memoryTotal}</span>
        <span class="font-bold text-success-600">HP {memoryTotal - draft}</span>
      </div>
      <input type="range" min="0" max={memoryTotal} bind:value={draft} class="w-full" aria-label="CP への割り当て量" />
      {#if cpUsed > draft}
        <!-- 下書きの CP より現在のプログラムが重い＝決定すると上限オーバー。CP を増やすか短くする必要がある。 -->
        <p class="mt-2 text-red-600">CP が不足（使用 {cpUsed}）。CP を増やすか、プログラムを短くしてください。</p>
      {/if}
      <div class="mt-2 flex justify-end gap-2">
        <button type="button" class="action-btn" onclick={() => (open = false)}>キャンセル</button>
        <button type="button" class="action-btn-strong" onclick={commitAllocation}>決定</button>
      </div>
    </div>
  {/if}
</div>
