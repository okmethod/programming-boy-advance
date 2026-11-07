<script lang="ts">
  // 総メモリ(memoryTotal)を HP↔CP に配分する。CP は戦闘に登場しない「作成予算」で、割り当てた cpAllocated がバーの上限になる。
  // HP（ヒープ）と同じメモリのメタファーなのでバーの見た目を HP に揃える（色は予算＝黄・超過＝赤。docs/design/ui-screen-design.md）。
  // 射程は見た目＋CP 上限まで。HP 側の配分はまだ表示だけで、実際の戦闘 HP には効かない。
  // TODO: 配分値を戦闘パラメータ（domain/battle/params.ts の BATTLE_PARAMS）へ反映する。ステージ構成・数値バランス確定後に着手（docs/game-rules/base-images.md）。
  // 読み取り専用の CP 表示が要るようになったら editable prop を足し、必要なら配分状態を親へ lift（YAGNI）。
  import { untrack } from "svelte";
  import Icon from "@iconify/svelte";

  interface CapacityAllocatorProps {
    // 現在のプログラムが消費する CP（組んだブロック数）。
    cpUsed: number;
    // 総メモリ＝HP↔CP 配分の原資（プレイ面=stage.capacity／レジストリ管理=既定容量）。
    memoryTotal: number;
  }

  let { cpUsed, memoryTotal }: CapacityAllocatorProps = $props();

  // 確定済みの CP 割り当て＝バーの上限。既定は全量 CP＝従来挙動（CP 上限＝総メモリ）を保つ。
  // untrack＝総メモリの現在値で初期シードするだけで以後は追従しない（配分はユーザー編集に委ねる）意図を明示。
  let cpAllocated = $state(untrack(() => memoryTotal));
  const over = $derived(cpUsed > cpAllocated);

  // 配分パネルの開閉と、スライダが触る下書き値。決定するまでゲージ（cpAllocated）には反映しない。
  let open = $state(false);
  let draft = $state(untrack(() => cpAllocated));
  // 下書き基準の超過量（決定するとこれだけ上限を超える）。配分パネルの見出しに添えて即時フィードバックする。
  const draftOverflow = $derived(Math.max(0, cpUsed - draft));

  // 開くたびに確定値から下書きを採り直す（前回のキャンセル分を引きずらない）。
  function openAllocation() {
    draft = cpAllocated;
    open = true;
  }
  function commitAllocation() {
    cpAllocated = draft;
    open = false;
  }
  // 右で CP 増・HP 減（スライダと同じ向き）。0〜総メモリでクランプ。
  function adjustDraft(delta: number) {
    draft = Math.min(memoryTotal, Math.max(0, draft + delta));
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
      <!-- 目盛りは上限本数に固定（1 セグメント＝1 CP のスケールを一定に保つ）。超過は本数を伸ばさず +N バッジで示す。
           超過時は予算を使い切った危険色として全セグメントを赤に塗る。 -->
      <div class="flex h-7 w-44 shrink-0 items-stretch gap-0.5 rounded-sm bg-surface-300 p-1">
        {#each Array(cpAllocated) as _, i (i)}
          <span class="flex-1 {over ? 'bg-red-500' : i < cpUsed ? 'bg-amber-300' : 'bg-surface-50'}"></span>
        {/each}
      </div>
      <span class="inline-flex shrink-0 items-baseline tabular-nums {over ? 'text-red-600' : 'text-surface-900'}">
        <span class="text-sm font-bold">{cpUsed}</span>
        <span class="px-0.5 text-xs text-surface-400">/</span>
        <span class="text-xs text-surface-500">{cpAllocated}</span>
      </span>
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
      <div class="mb-2 font-bold text-surface-700">
        メモリ配分{#if draftOverflow > 0}<span class="text-red-600">（超過 {draftOverflow}）</span>{/if}
      </div>
      <!-- 総メモリを CP と HP に振り分ける。CP 厚め＝複雑なプログラム／HP 厚め＝打たれ強い（トレードオフ）。 -->
      <!-- CP の数字は警告色にしない＝超過の赤は見出しの「（超過 N）」に寄せる。 -->
      <!-- 左右を等幅（1fr）＋中央ボタン固定＝CP/HP の桁数が変わっても増減ボタンの位置がぶれない。 -->
      <div class="mb-1.5 grid grid-cols-[1fr_auto_1fr] items-center tabular-nums">
        <span class="font-bold text-surface-700">CP {draft}</span>
        <div class="flex items-center justify-self-center gap-1">
          <button
            type="button"
            class="inline-flex items-center rounded border border-surface-300 p-0.5 text-surface-600 hover:bg-surface-200 disabled:opacity-40"
            onclick={() => adjustDraft(-1)}
            disabled={draft <= 0}
            aria-label="CP を減らす"
          >
            <Icon icon="mdi:chevron-left" class="size-4" />
          </button>
          <span class="text-surface-400">（{memoryTotal}）</span>
          <button
            type="button"
            class="inline-flex items-center rounded border border-surface-300 p-0.5 text-surface-600 hover:bg-surface-200 disabled:opacity-40"
            onclick={() => adjustDraft(1)}
            disabled={draft >= memoryTotal}
            aria-label="CP を増やす"
          >
            <Icon icon="mdi:chevron-right" class="size-4" />
          </button>
        </div>
        <span class="justify-self-end font-bold text-success-600">HP {memoryTotal - draft}</span>
      </div>
      <input type="range" min="0" max={memoryTotal} bind:value={draft} class="w-full" aria-label="CP への割り当て量" />
      <div class="mt-2 flex justify-end gap-2">
        <button type="button" class="action-btn" onclick={() => (open = false)}>キャンセル</button>
        <button type="button" class="action-btn-strong" onclick={commitAllocation}>決定</button>
      </div>
    </div>
  {/if}
</div>
