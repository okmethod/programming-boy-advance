<script lang="ts">
  // ブロックUI（Blockly）エディタ。組んだワークスペースをドメインの Program（命令木）に変換して通知する。
  // Blockly は DOM 必須のため use: アクション内で inject する（アクションはクライアントでのみ走る）。
  import { untrack } from "svelte";
  import { get } from "svelte/store";
  import * as Blockly from "blockly";
  import type { BaseImage, Program } from "#lib/application";
  import {
    registerBlocks,
    registerFixedWidthFlyout,
    categoriesForBaseImage,
    toolboxForBaseImage,
    type BlockCategory,
    workspaceToProgram,
    programToWorkspace,
    RETRO_THEME,
  } from "#lib/presentation/blockly";
  import { audioOn } from "#lib/presentation/sounds";

  interface BlocklyEditorProps {
    // 土台にする素質（系統×版）。付与命令セットがパレットに出せるブロックを決める（コマンド解放の seam）。
    baseImage: BaseImage;
    // ワークスペース変更のたびに最新の Program を通知する。
    onProgramChange: (program: Program) => void;
    // 親が重ねる見出し帯のぶん、パレットタブ行を右へ空けるクラス（横並びのクリアランス）。寸法は親が決める。
    headerReserve?: string;
  }

  let { baseImage, onProgramChange, headerReserve = "" }: BlocklyEditorProps = $props();

  let ws: Blockly.WorkspaceSvg | undefined;

  // 素質から導くパレットのカテゴリ（タブ＋フライアウトの素）。素質を切り替えると自動で追従する。
  // 素質が付与しない族は enabled=false の非活性タブとして残る（選べないが枠は見える）。
  const blockCategories = $derived(categoriesForBaseImage(baseImage));
  // フォールバック先＝先頭の活性カテゴリ（非活性タブは選択対象にしない）。コマンドは常に活性。
  const firstEnabled = $derived(blockCategories.find((category) => category.enabled) ?? blockCategories[0]);

  // パレット上部タブで選択中のカテゴリ。選んだカテゴリのブロックだけを固定幅フライアウトに出す。
  // 明示選択（クリック）前は undefined で、先頭の活性カテゴリにフォールバックする（素質が変わっても追従）。
  let selectedCategoryId = $state<string | undefined>(undefined);
  const activeCategoryId = $derived(selectedCategoryId ?? firstEnabled.id);

  // タブ配色＝ブロック配色（緑=コマンド / 青緑=クエリ / 黄土=制御）。色でカテゴリを識別させる。
  // テーマトークン（primary/secondary/tertiary）に寄せ、配色はテーマ差し替えで一括追従させる。
  // Tailwind スキャナー対策で動的クラスは文字列リテラルで持つ。
  const TAB_STYLE: Record<string, { active: string; idle: string }> = {
    command: {
      active: "border-primary-500 bg-primary-500 text-primary-contrast-500",
      idle: "border-primary-400 text-primary-700 hover:bg-primary-50",
    },
    query: {
      active: "border-secondary-500 bg-secondary-500 text-secondary-contrast-500",
      idle: "border-secondary-400 text-secondary-700 hover:bg-secondary-50",
    },
    control: {
      active: "border-tertiary-500 bg-tertiary-500 text-tertiary-contrast-500",
      idle: "border-tertiary-400 text-tertiary-700 hover:bg-tertiary-50",
    },
  };

  // 非活性タブ（素質が未付与の族）の配色。色でカテゴリを識別させず「まだ使えない」ことだけ示す。
  const TAB_DISABLED = "cursor-not-allowed border-surface-200 text-surface-300";

  // タブを選ぶ＝そのカテゴリのブロックだけをフライアウトに差し替える（横幅は不変・ポップアップ無し）。
  function selectCategory(category: BlockCategory) {
    selectedCategoryId = category.id;
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

  // 素質（baseImage）の切替でパレットを作り直す＝コマンド解放の seam を実機で効かせる。
  // マウント時は blockly() が初期化済みなので初回は skip。フライアウト操作と選択タブの更新は
  // 副作用（＝追加の購読を作らない）なので untrack で包む（購読するのは blockCategories だけ）。
  let paletteInitialized = false;
  $effect(() => {
    const categories = blockCategories;
    if (!paletteInitialized) {
      paletteInitialized = true;
      return;
    }
    const flyout = ws?.getFlyout();
    if (!flyout) return;
    untrack(() => {
      // 幅を温め直し、選択中タブ（版downで消えていたら先頭）のブロックを表示する。
      for (const category of categories) flyout.show(category.contents);
      // 選択中タブが版downで非活性化／消滅したら先頭の活性カテゴリに逃がす。
      const selected = categories.find((category) => category.id === selectedCategoryId);
      const active = selected?.enabled ? selected : (categories.find((category) => category.enabled) ?? categories[0]);
      selectedCategoryId = active.id;
      flyout.show(active.contents);
    });
  });

  // Blockly 内蔵音（接続・削除・切断）をアプリの音声 ON/OFF と連動させる。
  // Blockly は独自の AudioManager を持ち既定で鳴るため、ストアと別管理だと「OFF でも鳴る」ズレが出る。
  $effect(() => {
    ws?.getAudioManager().setMuted(!$audioOn);
  });

  function blockly(node: HTMLElement) {
    registerBlocks();
    // フライアウトを固定下限幅版に差し替えてからinject（タブ切替でパレット幅を一定に保つ）。
    registerFixedWidthFlyout();
    // trashcan はカテゴリ式だと既定で出るが、flyoutToolbox では既定オフのため明示する。
    // move: スクロールバー＋トラックパッド/ホイールスクロール＋ドラッグでパン（上下幅の不足を吸収）。
    // zoom: +/- とリセットのコントロールで拡大縮小（ホイールズームは scroll と競合するので切る）。
    ws = Blockly.inject(node, {
      toolbox: toolboxForBaseImage(baseImage),
      theme: RETRO_THEME,
      trashcan: true,
      move: { scrollbars: true, drag: true, wheel: true },
      zoom: { controls: true, wheel: false, startScale: 1, maxScale: 2, minScale: 0.6, scaleSpeed: 1.2 },
    });

    // 初期ミュート状態を inject 直後に確定する（以後のトグル追従は $effect が担う）。
    ws.getAudioManager().setMuted(!get(audioOn));

    // 全カテゴリを一度 show してフライアウト幅を全体最大に温める（sticky max を確定）。
    // これで最初のタブから幅が最大に固定され、タブ切替で原点がずれず配置済みブロックも動かない。
    const flyout = ws.getFlyout();
    for (const category of blockCategories) flyout?.show(category.contents);
    selectCategory(firstEnabled);

    // ブロックの追加・移動・値変更のたびに命令木を作り直して通知する。
    // ドラッグ中は新ブロックが独立トップ扱いになる過渡状態（workspaceToProgram は先頭連鎖1本だけ拾う）
    // なので再構築しない。ドロップ時の最終イベントで正しい program に更新される。
    ws.addChangeListener(() => {
      if (ws && !ws.isDragging()) onProgramChange(workspaceToProgram(ws));
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
<div class="flex h-full min-h-96 w-full flex-col overflow-hidden rounded border border-surface-300 bg-white">
  <!-- パレット上部タブ行。左端の「プログラム」見出しは親(BuildingArea)が1枚だけ描く帯なので、
       親が渡す headerReserve（横の空き）でその場所を空けてタブを横並びにする（見出しは単一要素で全タブ固定）。 -->
  <div class="flex shrink-0 items-center gap-1 p-2 {headerReserve}">
    {#each blockCategories as category (category.id)}
      {@const style = TAB_STYLE[category.id]}
      {@const tabStyle = !category.enabled
        ? TAB_DISABLED
        : activeCategoryId === category.id
          ? style.active
          : style.idle}
      <button
        class="rounded border px-3 py-1 text-sm {tabStyle}"
        disabled={!category.enabled}
        onclick={() => selectCategory(category)}
      >
        {category.label}
      </button>
    {/each}
  </div>
  <div use:blockly class="min-h-0 flex-1"></div>
</div>
