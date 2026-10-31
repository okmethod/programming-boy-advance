<script lang="ts">
  // ブロックUI（Blockly）エディタ。組んだワークスペースをドメインの Program（命令木）に変換して通知する。
  // Blockly は DOM 必須のため use: アクション内で inject する（アクションはクライアントでのみ走る）。
  import * as Blockly from "blockly";
  import type { Program } from "$lib/domain";
  import {
    registerBlocks,
    registerFixedWidthFlyout,
    TOOLBOX,
    BLOCK_CATEGORIES,
    type BlockCategory,
    workspaceToProgram,
    programToWorkspace,
  } from "$lib/presentation/blockly";

  interface BlocklyEditorProps {
    // ワークスペース変更のたびに最新の Program を通知する。
    onProgramChange: (program: Program) => void;
  }

  let { onProgramChange }: BlocklyEditorProps = $props();

  let ws: Blockly.WorkspaceSvg | undefined;

  // パレット上部タブで選択中のカテゴリ。選んだカテゴリのブロックだけを固定幅フライアウトに出す。
  let activeCategoryId = $state(BLOCK_CATEGORIES[0].id);

  // タブ配色＝ブロック配色（緑=コマンド / 青=クエリ / 橙=制御）。色でカテゴリを識別させる。
  // Tailwind スキャナー対策で動的クラスは文字列リテラルで持つ。
  const TAB_STYLE: Record<string, { active: string; idle: string }> = {
    command: {
      active: "border-emerald-600 bg-emerald-600 text-white",
      idle: "border-emerald-400 text-emerald-700 hover:bg-emerald-50",
    },
    query: {
      active: "border-sky-600 bg-sky-600 text-white",
      idle: "border-sky-400 text-sky-700 hover:bg-sky-50",
    },
    control: {
      active: "border-amber-600 bg-amber-600 text-white",
      idle: "border-amber-400 text-amber-700 hover:bg-amber-50",
    },
  };

  // タブを選ぶ＝そのカテゴリのブロックだけをフライアウトに差し替える（横幅は不変・ポップアップ無し）。
  function selectCategory(category: BlockCategory) {
    activeCategoryId = category.id;
    ws?.getFlyout()?.show(category.contents);
  }

  // 外部から Program を流し込む（お手本読み込み・保存復元）。Blockly を編集の SSoT に保つため、
  // 呼び出し側は allyProgram を直接書き換えず必ずこの口を通す。load 中の変更イベントは止め、
  // 復元後に一度だけ通知して順方向（Blockly → Program）でループを閉じる。
  export function load(program: Program): void {
    if (!ws) return;
    Blockly.Events.disable();
    try {
      programToWorkspace(ws, program);
    } finally {
      Blockly.Events.enable();
    }
    onProgramChange(workspaceToProgram(ws));
  }

  // 外部からサイズ再計算を促す。ドロワーを transform で開くとコンテナのボックスサイズが
  // 変わらず ResizeObserver が発火しないため、開いた後に呼んでスクロールバー位置を正す。
  export function resize(): void {
    if (ws) Blockly.svgResize(ws);
  }

  function blockly(node: HTMLElement) {
    registerBlocks();
    // フライアウトを固定下限幅版に差し替えてからinject（タブ切替でパレット幅を一定に保つ）。
    registerFixedWidthFlyout();
    // trashcan はカテゴリ式だと既定で出るが、flyoutToolbox では既定オフのため明示する。
    // move: スクロールバー＋トラックパッド/ホイールスクロール＋ドラッグでパン（上下幅の不足を吸収）。
    // zoom: +/- とリセットのコントロールで拡大縮小（ホイールズームは scroll と競合するので切る）。
    ws = Blockly.inject(node, {
      toolbox: TOOLBOX,
      trashcan: true,
      move: { scrollbars: true, drag: true, wheel: true },
      zoom: { controls: true, wheel: false, startScale: 1, maxScale: 2, minScale: 0.6, scaleSpeed: 1.2 },
    });

    // 全カテゴリを一度 show してフライアウト幅を全体最大に温める（sticky max を確定）。
    // これで最初のタブから幅が最大に固定され、タブ切替で原点がずれず配置済みブロックも動かない。
    const flyout = ws.getFlyout();
    for (const category of BLOCK_CATEGORIES) flyout?.show(category.contents);
    selectCategory(BLOCK_CATEGORIES[0]);

    // ブロックの追加・移動・値変更のたびに命令木を作り直して通知する。
    ws.addChangeListener(() => {
      if (ws) onProgramChange(workspaceToProgram(ws));
    });

    // コンテナのリサイズに Blockly の SVG を追従させる。
    const observer = new ResizeObserver(() => {
      if (ws) Blockly.svgResize(ws);
    });
    observer.observe(node);

    return {
      destroy() {
        observer.disconnect();
        ws?.dispose();
        ws = undefined;
      },
    };
  }
</script>

<!-- パレット上部タブ＋Blockly を1つの枠で囲む（タブ込みで上端を右の参照レールに揃える）。
     高さは配置先に委ねる（ドロワーでは余白いっぱいに広がる）。 -->
<div class="flex h-full min-h-96 w-full flex-col overflow-hidden rounded border border-gray-300">
  <div class="flex shrink-0 gap-1 border-b border-gray-200 bg-gray-50 p-2">
    {#each BLOCK_CATEGORIES as category (category.id)}
      {@const style = TAB_STYLE[category.id]}
      <button
        class="rounded border px-3 py-1 text-sm {activeCategoryId === category.id ? style.active : style.idle}"
        onclick={() => selectCategory(category)}
      >
        {category.label}
      </button>
    {/each}
  </div>
  <div use:blockly class="min-h-0 flex-1"></div>
</div>
