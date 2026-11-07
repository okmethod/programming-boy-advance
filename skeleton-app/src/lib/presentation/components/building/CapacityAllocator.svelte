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

  // 配分スライダは STEP（8）刻みの目盛り。total=32 なら 0/8/16/24/32 の5目盛りを軌道に見せる。
  // ただし両端（CP0/HP全 と 全CP/HP0）は選ばせない＝可動域は [STEP, total-STEP]=[8,24]（中央16/16）。
  // 端へ寄せても clampCp が value を内側の目盛りへ丸めるので、両端はスライダ上で素通りする。
  // total を STEP*2（=16）に絞ったステージは一択＝自由度ゼロ（導入ステージ用）。
  // TODO: STEP も memoryTotal と同様いずれステージ定義から渡す（今は既定 8 固定）。
  const STEP = 8;
  const CP_MIN = STEP;
  const cpMax = $derived(memoryTotal - STEP);
  const clampCp = (value: number) => Math.min(cpMax, Math.max(CP_MIN, value));
  // 使用ブロック数を次の目盛り（STEP 境界）へ切り上げる（端数は内部フラグメント）。
  const stepUp = (value: number) => Math.ceil(value / STEP) * STEP;

  // 追従モードでの CP 上限＝使用ブロック数を含む最小の目盛り（切り上げ）。可動域にクランプする。
  const followedCp = $derived(clampCp(stepUp(cpUsed)));

  // 配分パネルの枚数＝総メモリを STEP で割ったチャンク数（total=32, STEP=8 → 4枚）。
  const chunkCount = $derived(memoryTotal / STEP);

  // ブロック数への自動追従トグル。ON の間は CP 上限が使用ブロック数に貼り付く（スライダ・増減は無効）。
  // 既定 OFF＝手動配分を最初から触れるようにする。初期値はアライメントのクランプで必ず妥当な分割
  // （両側 ≥1チャンク）になるため、HP=0 回避のために追従を既定 ON にする必要はもう無い。
  let follow = $state(false);

  // 確定済みの CP 割り当て＝バーの上限。追従 ON の間は followedCp に追従する（下の $effect）。
  let cpAllocated = $state(untrack(() => clampCp(stepUp(cpUsed))));
  const over = $derived(cpUsed > cpAllocated);

  // 配分パネルの開閉と、スライダが触る下書き値。決定するまでゲージ（cpAllocated）には反映しない。
  let open = $state(false);
  let draft = $state(untrack(() => clampCp(stepUp(cpUsed))));
  // 下書き基準の超過量（決定するとこれだけ上限を超える）。配分パネルの見出しに添えて即時フィードバックする。
  const draftOverflow = $derived(Math.max(0, cpUsed - draft));

  // 追従 ON の間は確定値も下書きも使用ブロック数に貼り付ける（パネルの数字・バーを実値に同期）。
  $effect(() => {
    if (follow) {
      cpAllocated = followedCp;
      draft = followedCp;
    }
  });

  // 開くたびに確定値から下書きを採り直す（前回のキャンセル分を引きずらない）。
  function openAllocation() {
    draft = cpAllocated;
    open = true;
  }
  function commitAllocation() {
    cpAllocated = draft;
    open = false;
  }
  // 右で CP 増・HP 減（スライダと同じ向き）。1目盛り（STEP）単位で動かし可動域でクランプ。
  function adjustDraft(steps: number) {
    draft = clampCp(draft + steps * STEP);
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
      <!-- 数字は固定幅（2桁ぶん）で右揃え＝桁数が変わっても歯車までの幅がぶれない。 -->
      <span class="inline-flex shrink-0 items-baseline tabular-nums {over ? 'text-red-600' : 'text-surface-900'}">
        <span class="inline-block w-[2ch] text-right text-sm font-bold">{cpUsed}</span>
        <span class="px-0.5 text-xs text-surface-400">/</span>
        <span class="inline-block w-[2ch] text-right text-xs text-surface-500">{cpAllocated}</span>
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
      <!-- 見出しと追従トグルを同列に。追従 ON の間は下の手動配分（ボタン/スライダ/決定）を無効化する。
           超過表示はここに出すと横幅が広がるため、下段（ボタン左）の空きスロットへ逃がす。 -->
      <div class="mb-2 flex items-center justify-between gap-2">
        <span class="font-bold text-surface-700">メモリ配分</span>
        <label class="flex shrink-0 cursor-pointer items-center gap-1 text-surface-600">
          <input type="checkbox" bind:checked={follow} class="accent-primary-500" />
          ブロック数に自動追従
        </label>
      </div>
      <!-- 総メモリを CP と HP に振り分ける。CP 厚め＝複雑なプログラム／HP 厚め＝打たれ強い（トレードオフ）。 -->
      <!-- CP の数字は警告色にしない＝超過の赤は見出しの「（超過 N）」に寄せる。 -->
      <!-- 左右を等幅（1fr）＋中央ボタン固定＝CP/HP の桁数が変わっても増減ボタンの位置がぶれない。 -->
      <div class="mb-1.5 grid grid-cols-[1fr_auto_1fr] items-center tabular-nums">
        <span class="font-bold text-surface-700">CP <span class="inline-block w-[2ch] text-right">{draft}</span></span>
        <div class="flex items-center justify-self-center gap-1">
          <button
            type="button"
            class="inline-flex items-center rounded border border-surface-300 p-0.5 text-surface-600 hover:bg-surface-200 disabled:opacity-40"
            onclick={() => adjustDraft(-1)}
            disabled={follow || draft <= CP_MIN}
            aria-label="CP を減らす"
          >
            <Icon icon="mdi:chevron-left" class="size-4" />
          </button>
          <span class="text-surface-400">（{memoryTotal}）</span>
          <button
            type="button"
            class="inline-flex items-center rounded border border-surface-300 p-0.5 text-surface-600 hover:bg-surface-200 disabled:opacity-40"
            onclick={() => adjustDraft(1)}
            disabled={follow || draft >= cpMax}
            aria-label="CP を増やす"
          >
            <Icon icon="mdi:chevron-right" class="size-4" />
          </button>
        </div>
        <span class="justify-self-end font-bold text-success-600"
          >HP <span class="inline-block w-[2ch] text-right">{memoryTotal - draft}</span></span
        >
      </div>
      <!-- 配分パネル：総メモリを STEP(8) チャンクの四角パネルで並べ、CP=アンバー／HP=緑で塗り分ける
           （色言語を踏襲：CP=ゲージの消費色アンバー／HP=戦闘 HP バーと同じ bg-green-500）。クリックした所まで CP に寄せる。
           CP は [8,24] にクランプされるので左端は必ず CP・右端は必ず HP＝両端（0/全量）は作れない。 -->
      <div
        class="flex h-7 items-stretch gap-0.5 rounded-sm bg-surface-300 p-1 {follow ? 'opacity-40' : ''}"
        role="group"
        aria-label="CP への割り当て量"
      >
        {#each Array(chunkCount) as _, i (i)}
          {@const isCp = (i + 1) * STEP <= draft}
          <button
            type="button"
            class={isCp ? "flex-1 bg-amber-300 hover:bg-amber-400" : "flex-1 bg-green-500 hover:bg-green-600"}
            disabled={follow}
            onclick={() => (draft = clampCp((i + 1) * STEP))}
            aria-label={`CP を ${clampCp((i + 1) * STEP)} にする`}
            aria-pressed={isCp}
          ></button>
        {/each}
      </div>
      <!-- 左スロットに超過評価（出ても横幅を押し広げない）、右にキャンセル/決定。 -->
      <div class="mt-2 flex items-center justify-between gap-2">
        <span class="inline-flex items-center gap-1 text-xs font-bold text-red-600">
          {#if draftOverflow > 0}<Icon icon="mdi:alert" class="size-4" />超過 {draftOverflow}{/if}
        </span>
        <div class="flex gap-2">
          <button type="button" class="action-btn" onclick={() => (open = false)}>キャンセル</button>
          <button type="button" class="action-btn-strong" onclick={commitAllocation} disabled={follow}>決定</button>
        </div>
      </div>
    </div>
  {/if}
</div>
