<script lang="ts">
  // エディタ編集面の編集可能サーフェス＝擬似コードをテキストで直接編集する。
  // code モード中はこのテキストが「編集の SSoT」（ブロック編集では Blockly が SSoT なのと対になる権威移譲）。
  // 逆変換（parseProgram）はアプリ層の workbench facade に閉じるため、この部品はテキストを上へ流すだけ
  // ＝BlocklyEditor が onProgramChange で親に委ねるのと同じ dumb な配線にする（facade 直呼びはしない）。
  // 構文エラーは親から errors prop で降ってくるのを表示するだけ。表示専用の ProgramViewer とは役割が違うため別部品。
  //
  // 見た目は ProgramViewer に寄せる：暗地（gray-900）・緑モノスペース・行番号ガターまで揃え、読み↔編集の連続性を担保する。
  // textarea は内側スクロールなので、ガターは overlay にして縦スクロールを同期する。
  import { untrack } from "svelte";
  import Icon from "@iconify/svelte";
  import type { ParseError } from "$lib/application";

  interface ProgramEditorProps {
    // マウント時の種テキスト（親が $draftText で渡す）。以後の権威はこのローカルテキスト。
    initialText: string;
    // テキスト変更のたび呼ぶ（親が facade.setProgramFromText に委ねて反映＆エラー判定する）。
    onInput: (text: string) => void;
    // 現在のパースエラー（構文＋素質外。成功時は空配列）。親が facade 戻り値から降ろす。種別で色分けして表示する。
    errors: readonly ParseError[];
  }

  let { initialText, onInput, errors }: ProgramEditorProps = $props();

  // テキストが権威なので、マウント時に一度だけ種を取り以後はローカルに持つ（親からの再供給で上書きしない）。
  // untrack で「初期値限りの参照」を明示（初期値だけ捕まえる＝カーソル飛び回避の意図）。
  let text = $state(untrack(() => initialText));

  // 本文の行配列。ガター（番号・警告マーク）とハイライト層（行ごとの着色）の両方がこの行割りを共有する。
  const lines = $derived(text.split("\n"));
  // 行番号ガターの行数＝テキストの行数（空でも1行は出す＝viewer の1始まり番号と揃える）。
  const lineCount = $derived(Math.max(1, lines.length));
  // エラー行（1 始まり）をガター番号の色で示す（viewer の active 行強調に相当）。
  // 種別で色を分ける: syntax＝文法NG（赤・ビルド不可）／capability＝素質外（黄・文法は妥当）。
  // 同じ行に両方が載ることがある（例: `if badsensor:` の if=素質外＋badsensor=文法NG）ため、
  // より重い syntax（赤）を優先し、syntax が無い行だけ capability（黄）で塗る。
  const syntaxLines = $derived(new Set(errors.filter((e) => e.kind === "syntax").map((e) => e.line)));
  const capabilityLines = $derived(new Set(errors.filter((e) => e.kind === "capability").map((e) => e.line)));
  // 本文ハイライト層の行ごとの文字色（ガター番号と同じ規則）。class 属性を短く保ち、whitespace-pre の中身を
  // インライン描画できるようにする（空白の意味を壊さないため本文は改行させず1行で描く）。リテラルなので Tailwind が検出する。
  const lineColor = (lineNo: number): string =>
    syntaxLines.has(lineNo) ? "text-red-400" : capabilityLines.has(lineNo) ? "text-yellow-400" : "text-green-300";
  // フッターは種別ごとの要約を最大2行で出す（どの行かは本文側の番号色＋警告マークで分かるので行番号は出さない）。
  // 地色は重い方に寄せる（syntax が1つでもあれば赤帯、capability だけなら黄帯）。
  const hasSyntaxError = $derived(errors.some((e) => e.kind === "syntax"));
  const hasCapabilityError = $derived(errors.some((e) => e.kind === "capability"));

  // textarea（内側スクロール）に overlay 2 枚を追従させる。
  //  - ガター：縦のみ同期（番号は左に固定するので横は動かさない）。
  //  - ハイライト層：縦横とも同期（本文と同じ字送りで重ねるため。wrap=off なので横も要る）。
  let gutterInner = $state<HTMLElement>();
  let highlightInner = $state<HTMLElement>();
  function syncScroll(event: Event) {
    const ta = event.currentTarget as HTMLTextAreaElement;
    if (gutterInner) gutterInner.style.transform = `translateY(${-ta.scrollTop}px)`;
    if (highlightInner) highlightInner.style.transform = `translate(${-ta.scrollLeft}px, ${-ta.scrollTop}px)`;
  }
</script>

<!-- エディタ本体とエラー欄を1つの暗色パネルに収め、コンソール調で一体に見せる（エラー欄だけ浮かせない）。 -->
<div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded bg-gray-900 font-mono text-xs leading-relaxed">
  <!-- 編集本体：ProgramViewer と同じ暗地・緑モノスペース・行番号ガターで揃える。 -->
  <div class="relative min-h-0 flex-1 overflow-hidden">
    <!-- 行番号ガター（overlay・縦スクロール同期）。bg で横スクロール時に下を流れる本文を隠す。
         ▶ の無い編集面でも viewer と桁を合わせるため w-4（旧 ▶ 列）＋ w-7（番号列）を踏襲する。 -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-y-0 left-0 w-11 overflow-hidden bg-gray-900 py-1">
      <div bind:this={gutterInner}>
        {#each Array(lineCount) as _, i (i)}
          <div class="flex">
            <!-- 警告マーク列（syntax=赤・丸／capability=黄・三角）。両方載る行は重い syntax を優先。
                 左端べったりを避けるためマーク列を広め（w-6）に取り右寄せする。viewer と合わせる gutter 総幅
                 （w-11＝本文 pl-11）と番号の右端位置は保ちつつ、内訳だけ w-6（マーク）＋w-5（番号）に振り分ける。 -->
            <span class="flex w-6 shrink-0 items-center justify-end pr-1">
              {#if syntaxLines.has(i + 1)}
                <Icon icon="mdi:alert-circle-outline" class="size-3 text-red-400" />
              {:else if capabilityLines.has(i + 1)}
                <Icon icon="mdi:alert-outline" class="size-3 text-yellow-400" />
              {/if}
            </span>
            <span
              class="w-5 shrink-0 pr-2 text-right {syntaxLines.has(i + 1)
                ? 'text-red-400'
                : capabilityLines.has(i + 1)
                  ? 'text-yellow-400'
                  : 'text-gray-500'}">{i + 1}</span
            >
          </div>
        {/each}
      </div>
    </div>

    <!-- 本文ハイライト層（overlay・縦横同期）。textarea の文字を透明にし、ここで行ごとに色を塗る
         （エラー行＝番号と同じ赤/黄・それ以外＝緑）。textarea と同じ字送り（font/leading/padding/pre）で重ねる。
         ガターより後・textarea より前に置き、x<44（ガター域）は透明にしてガターを透かす。 -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div bind:this={highlightInner} class="w-max py-1 pr-2 pl-11">
        {#each lines as line, i (i)}
          <!-- 空行も行箱の高さを保つため最低1文字（半角空白）を描く＝番号・textarea と行高を揃える。 -->
          <div class="whitespace-pre {lineColor(i + 1)}">{line.length === 0 ? " " : line}</div>
        {/each}
      </div>
    </div>

    <!-- テキスト本体：ガター幅ぶん左を空け、viewer と同じ py-1。文字自体は透明にし、色はハイライト層が担う
         （textarea は1色しか塗れないため）。キャレットだけ緑で残す。wrap=off で折り返さず横スクロール。 -->
    <textarea
      bind:value={text}
      oninput={() => onInput(text)}
      onscroll={syncScroll}
      spellcheck="false"
      wrap="off"
      class="absolute inset-0 resize-none overflow-auto whitespace-pre bg-transparent py-1 pr-2 pl-11 font-mono text-xs leading-relaxed text-transparent caret-green-200 outline-none"
      aria-label="プログラム（テキスト編集）"></textarea>
  </div>

  {#if errors.length > 0}
    <!-- エラー欄：暗色パネル下部のフッター。確定（タブ切替・ビルド）はこれがある間ブロックされる。
         行ごとの列挙はせず種別ごとの要約を最大2行で出す（該当行は本文の番号色＋警告マークが示す）。
         地色は重い方に寄せる（syntax が1つでもあれば赤帯、capability だけなら黄帯）。 -->
    <div class="shrink-0 px-2 py-1.5 {hasSyntaxError ? 'bg-red-500/10' : 'bg-yellow-500/10'}">
      {#if hasCapabilityError}
        <div class="flex items-start gap-1 text-yellow-300">
          <Icon icon="mdi:alert-outline" class="size-4 shrink-0" />
          <span>このベースイメージでは使用できない構文です</span>
        </div>
      {/if}
      {#if hasSyntaxError}
        <div class="flex items-start gap-1 text-red-300">
          <Icon icon="mdi:alert-circle-outline" class="size-4 shrink-0" />
          <span>無効な構文です</span>
        </div>
      {/if}
    </div>
  {/if}
</div>
