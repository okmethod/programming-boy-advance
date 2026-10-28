<script lang="ts">
  // 命令木（Program）を擬似コードのテキストに整形して表示する（表示専用）。
  import type { Stmt } from "$lib/domain";

  interface ProgramTextProps {
    title: string;
    program: readonly Stmt[];
  }

  let { title, program }: ProgramTextProps = $props();

  function programToText(stmts: readonly Stmt[], indent = 0): string {
    return stmts.map((s) => stmtToText(s, indent)).join("\n");
  }

  function stmtToText(s: Stmt, indent: number): string {
    const pad = "  ".repeat(indent);
    switch (s.kind) {
      case "call":
        return `${pad}${s.cmd}()`;
      case "repeat":
        return `${pad}repeat ${s.count}:\n${programToText(s.body, indent + 1)}`;
      case "if": {
        const base = `${pad}if ${s.cond}:\n${programToText(s.then, indent + 1)}`;
        return s.else ? `${base}\n${pad}else:\n${programToText(s.else, indent + 1)}` : base;
      }
      case "while":
        return `${pad}while ${s.cond}:\n${programToText(s.body, indent + 1)}`;
      default:
        return "";
    }
  }
</script>

<div>
  <h2 class="mb-1 text-sm font-bold">{title}</h2>
  <pre class="overflow-auto rounded bg-gray-900 p-2 text-xs text-green-300">{programToText(program) || "(なし)"}</pre>
</div>
