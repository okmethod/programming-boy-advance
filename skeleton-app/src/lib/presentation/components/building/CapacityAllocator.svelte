<script lang="ts">
  // 総メモリ(memoryTotal)を HP↔CP に配分する。CP は戦闘に登場しない「作成予算」で、割り当てた cpAllocated がバーの上限になる。
  // 位置づけ＝起動時パラメータ（コンテナの docker run --memory/--cpus 相当）。イメージには焼かれず、
  // 起動（デプロイ）時に供給される自動機の属性なので、ヘッダーのマニフェスト（イメージタイル横）に常時出す。
  // HP（ヒープ）と同じメモリのメタファーなのでバーの見た目を HP に揃える（色は予算＝黄・超過＝赤。docs/design/ui-screen-design.md）。
  // 射程は見た目＋CP 上限まで。HP 側の配分（memoryTotal − cpAllocated）は親へ bind され、デプロイ時に ally の初期 HP になる。
  import { untrack } from "svelte";
  import Icon from "@iconify/svelte";
  import FractionReadout from "#lib/presentation/components/shared/FractionReadout.svelte";

  // 配分スライダは memoryGrain 刻みの目盛り。total=32・grain=8 なら 0/8/16/24/32 の5目盛りを軌道に見せる。
  // ただし両端（CP0/HP全 と 全CP/HP0）は選ばせない＝可動域は [grain, total-grain]=[8,24]（中央16/16）。
  // 端へ寄せても clampCp が value を内側の目盛りへ丸めるので、両端はスライダ上で素通りする。
  // total を grain*2（=16）に絞ったステージは一択＝自由度ゼロ（導入ステージ用）。

  interface CapacityAllocatorProps {
    // 現在のプログラムが消費する CP（組んだブロック数）。
    cpUsed: number;
    // メモリ総量＝HP↔CP 配分の原資（プレイ面=stage.memoryTotal／サンドボックス=画面ローカル既定）。
    memoryTotal: number;
    // 配分の刻み幅＝目盛り間隔（プレイ面=stage.memoryGrain／サンドボックス=画面ローカル既定）。memoryTotal はこの倍数である前提。
    memoryGrain: number;
    // 確定済みの CP 割り当て（＝バーの上限）。親が所有し bind で渡す（初期値も親が確定済み）。
    // HP 側（memoryTotal − cpAllocated）を親がデプロイへ運ぶ。
    cpAllocated: number;
  }

  let { cpUsed, memoryTotal, memoryGrain, cpAllocated = $bindable() }: CapacityAllocatorProps = $props();

  // 可動域の下限＝1 目盛り（CP0 を作らせない）。memoryGrain は reactive prop なので derived で追従する。
  const CP_MIN = $derived(memoryGrain);
  // 使用ブロック数を次の目盛り（grain 境界）へ切り上げる（端数は内部フラグメント）。
  const ceilToGrain = (value: number) => Math.ceil(value / memoryGrain) * memoryGrain;
  const cpMax = $derived(memoryTotal - memoryGrain);
  const clampCp = (value: number) => Math.min(cpMax, Math.max(CP_MIN, value));

  // 追従モードでの CP 上限＝使用ブロック数を含む最小の目盛り（切り上げ）。可動域にクランプする。
  const followedCp = $derived(clampCp(ceilToGrain(cpUsed)));

  // 配分パネルの枚数＝総メモリを grain で割ったチャンク数（total=32・grain=8 → 4枚）。
  // memoryTotal は memoryGrain の倍数である前提（stage.memoryGrain の invariant）。倍数でないステージ
  // 容量が渡っても {#each Array()} が非整数長で落ちないよう ceil で整数に丸める（可動域は clampCp 側が担保）。
  const chunkCount = $derived(Math.ceil(memoryTotal / memoryGrain));

  // ブロック数への自動追従トグル。ON の間は CP 上限が使用ブロック数に貼り付く（スライダ・増減は無効）。
  // 既定 OFF＝手動配分を最初から触れるようにする。初期値はアライメントのクランプで必ず妥当な分割
  // （両側 ≥1チャンク）になるため、HP=0 回避のために追従を既定 ON にする必要はもう無い。
  let follow = $state(false);

  // 確定済みの CP 割り当て（cpAllocated＝bindable prop）に対する超過フラグ。追従 ON の間は followedCp に追従する（下の $effect）。
  const over = $derived(cpUsed > cpAllocated);

  // 配分パネルの開閉と、スライダが触る下書き値。決定するまでゲージ（cpAllocated）には反映しない。
  let open = $state(false);
  let draft = $state(untrack(() => clampCp(ceilToGrain(cpUsed))));
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
  // 右で CP 増・HP 減（スライダと同じ向き）。1目盛り（grain）単位で動かし可動域でクランプ。
  function adjustDraft(steps: number) {
    draft = clampCp(draft + steps * memoryGrain);
  }
</script>

<!-- 常時表示チップ＋配分ポップオーバー。チップはゲージ＋歯車に絞り、配分パネルは
     高さ固定のヘッダー（マニフェスト）を押し広げないよう chip 直下へ絶対配置でポップする。 -->
<div class="relative">
  <!-- 常時表示チップ：CP ゲージ＋配分トグル（歯車）。半透明の明地で暗背景でも読める。 -->
  <div class="flex items-center gap-1.5 rounded border border-surface-300 bg-surface-50/95 px-2 py-0.5 shadow-sm">
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
      <!-- 固定幅の分数で桁数が変わっても歯車までの幅がぶれない。 -->
      <FractionReadout
        numerator={cpUsed}
        denominator={cpAllocated}
        cRoot={over ? "text-red-600" : "text-surface-900"}
        cNumerator="text-sm font-bold"
        cSlash="px-0.5 text-xs text-surface-400"
        cDenominator="text-xs text-surface-500"
      />
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
    <!-- 配分ポップオーバー：チップ直下へ絶対配置（ヘッダー高さを変えない）。即時反映せずキャンセル/決定で確定する。 -->
    <div
      class="absolute right-0 top-full z-40 mt-1 w-72 rounded border border-surface-300 bg-surface-50 p-2 text-xs shadow-lg"
    >
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
      <!-- 配分パネル：総メモリを grain チャンクの四角パネルで並べ、CP=アンバー／HP=緑で塗り分ける
           （色言語を踏襲：CP=ゲージの消費色アンバー／HP=戦闘 HP バーと同じ bg-green-500）。クリックした所まで CP に寄せる。
           CP は [8,24] にクランプされるので左端は必ず CP・右端は必ず HP＝両端（0/全量）は作れない。 -->
      <div
        class="flex h-7 items-stretch gap-0.5 rounded-sm bg-surface-300 p-1 {follow ? 'opacity-40' : ''}"
        role="group"
        aria-label="CP への割り当て量"
      >
        {#each Array(chunkCount) as _, i (i)}
          {@const isCp = (i + 1) * memoryGrain <= draft}
          <button
            type="button"
            class={isCp ? "flex-1 bg-amber-300 hover:bg-amber-400" : "flex-1 bg-green-500 hover:bg-green-600"}
            disabled={follow}
            onclick={() => (draft = clampCp((i + 1) * memoryGrain))}
            aria-label={`CP を ${clampCp((i + 1) * memoryGrain)} にする`}
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
