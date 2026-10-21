<script lang="ts">
  // ブロックUI（Blockly）エディタ。組んだワークスペースをドメインの Program（命令木）に変換して通知する。
  // Blockly は DOM 必須のため use: アクション内で inject する（アクションはクライアントでのみ走る）。
  import * as Blockly from "blockly";
  import type { Program } from "$lib/domain";
  import { registerBlocks, TOOLBOX, workspaceToProgram } from "$lib/blockly";

  interface BlocklyEditorProps {
    // ワークスペース変更のたびに最新の Program を通知する。
    onProgramChange: (program: Program) => void;
  }

  let { onProgramChange }: BlocklyEditorProps = $props();

  function blockly(node: HTMLElement) {
    registerBlocks();
    const ws = Blockly.inject(node, { toolbox: TOOLBOX });

    // ブロックの追加・移動・値変更のたびに命令木を作り直して通知する。
    ws.addChangeListener(() => onProgramChange(workspaceToProgram(ws)));

    // コンテナのリサイズに Blockly の SVG を追従させる。
    const observer = new ResizeObserver(() => Blockly.svgResize(ws));
    observer.observe(node);

    return {
      destroy() {
        observer.disconnect();
        ws.dispose();
      },
    };
  }
</script>

<div use:blockly class="h-96 w-full rounded border border-gray-300"></div>
