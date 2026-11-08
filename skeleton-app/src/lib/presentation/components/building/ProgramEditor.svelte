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
    // 現在の構文エラー（成功時は空配列）。親が facade 戻り値から降ろす。
    errors: readonly ParseError[];
  }

  let { initialText, onInput, errors }: ProgramEditorProps = $props();

  // テキストが権威なので、マウント時に一度だけ種を取り以後はローカルに持つ（親からの再供給で上書きしない）。
  // untrack で「初期値限りの参照」を明示（初期値だけ捕まえる＝カーソル飛び回避の意図）。
  let text = $state(untrack(() => initialText));

  // 行番号ガターの行数＝テキストの行数（空でも1行は出す＝viewer の1始まり番号と揃える）。
  const lineCount = $derived(Math.max(1, text.split("\n").length));
  // エラー行（1 始まり）の集合＝ガターの番号を赤くして位置を示す（viewer の active 行強調に相当）。
  const errorLines = $derived(new Set(errors.map((e) => e.line)));

  // textarea（内側スクロール）とガター overlay の縦位置を揃える。横スクロールはガターを動かさない（番号は左に固定）。
  let gutterInner = $state<HTMLElement>();
  function syncScroll(event: Event) {
    const ta = event.currentTarget as HTMLTextAreaElement;
    if (gutterInner) gutterInner.style.transform = `translateY(${-ta.scrollTop}px)`;
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
            <span class="w-4 shrink-0"></span>
            <span class="w-7 shrink-0 pr-2 text-right {errorLines.has(i + 1) ? 'text-red-400' : 'text-gray-500'}"
              >{i + 1}</span
            >
          </div>
        {/each}
      </div>
    </div>

    <!-- テキスト本体：ガター幅ぶん左を空け、viewer と同じ py-1・緑文字で描く。wrap=off で折り返さず横スクロール。 -->
    <textarea
      bind:value={text}
      oninput={() => onInput(text)}
      onscroll={syncScroll}
      spellcheck="false"
      wrap="off"
      class="absolute inset-0 resize-none overflow-auto whitespace-pre bg-transparent py-1 pr-2 pl-11 font-mono text-xs leading-relaxed text-green-300 caret-green-200 outline-none"
      aria-label="プログラム（テキスト編集）"></textarea>
  </div>

  {#if errors.length > 0}
    <!-- 構文エラー：暗色パネル下部のフッター（赤アクセントの区切り線）。行番号つきで列挙し、
         確定（タブ切替・ビルド）はこれがある間ブロックされる。多数でもパネルを潰さないよう最大高で内部スクロール。 -->
    <div class="max-h-28 shrink-0 overflow-auto bg-red-500/10 px-2 py-1.5 text-red-300">
      {#each errors as e (e.line + e.message)}
        <div class="flex items-start gap-1">
          <Icon icon="mdi:alert-circle-outline" class="size-4 shrink-0" />
          <span>L{e.line}: {e.message}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
