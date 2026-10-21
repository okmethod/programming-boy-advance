import { describe, expect, it } from "vitest";
import * as Blockly from "blockly";
import type { Block } from "blockly";
import { registerBlocks } from "./blocks";
import { workspaceToProgram } from "./toProgram";

registerBlocks();

// statement input（BODY/THEN/ELSE）に子ブロックを接続する。
function attachTo(parent: Block, inputName: string, child: Block): void {
  parent.getInput(inputName)!.connection!.connect(child.previousConnection!);
}

describe("workspaceToProgram", () => {
  it("空ワークスペースは空配列", () => {
    const ws = new Blockly.Workspace();
    expect(workspaceToProgram(ws)).toEqual([]);
  });

  it("repeat 内に if(then/else) を持つネストを命令木に変換する", () => {
    const ws = new Blockly.Workspace();

    const repeat = ws.newBlock("ctrl_repeat");
    repeat.setFieldValue(3, "COUNT");

    const ifBlock = ws.newBlock("ctrl_if");
    ifBlock.setFieldValue("enemyAhead", "COND");
    attachTo(ifBlock, "THEN", ws.newBlock("cmd_attack"));
    attachTo(ifBlock, "ELSE", ws.newBlock("cmd_stepForward"));

    attachTo(repeat, "BODY", ifBlock);

    // repeat の次に turnRight を連鎖させる。
    repeat.nextConnection!.connect(ws.newBlock("cmd_turnRight").previousConnection!);

    expect(workspaceToProgram(ws)).toEqual([
      {
        kind: "repeat",
        count: 3,
        body: [
          {
            kind: "if",
            cond: "enemyAhead",
            then: [{ kind: "call", cmd: "attack" }],
            else: [{ kind: "call", cmd: "stepForward" }],
          },
        ],
      },
      { kind: "call", cmd: "turnRight" },
    ]);
  });

  it("if の else が空なら else を省く", () => {
    const ws = new Blockly.Workspace();
    const ifBlock = ws.newBlock("ctrl_if");
    ifBlock.setFieldValue("wallAhead", "COND");
    attachTo(ifBlock, "THEN", ws.newBlock("cmd_turnLeft"));

    expect(workspaceToProgram(ws)).toEqual([
      { kind: "if", cond: "wallAhead", then: [{ kind: "call", cmd: "turnLeft" }] },
    ]);
  });
});
