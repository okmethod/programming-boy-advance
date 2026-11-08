import { describe, expect, it } from "vitest";
import * as Blockly from "blockly";
import type { Program } from "$lib/application";
import { registerBlocks } from "./blocks";
import { workspaceToProgram } from "./toProgram";
import { programToWorkspace } from "./toWorkspace";

registerBlocks();

// 復元 → 変換で元の Program に戻ることを確かめる（workspaceToProgram との往復）。
function roundTrip(program: Program): Program {
  const ws = new Blockly.Workspace();
  programToWorkspace(ws, program);
  return workspaceToProgram(ws);
}

describe("programToWorkspace", () => {
  it("空 Program は空ワークスペース（往復しても空）", () => {
    expect(roundTrip([])).toEqual([]);
  });

  it("repeat 内に if(then/else) を持つネストを復元できる", () => {
    const program: Program = [
      {
        kind: "repeat",
        count: 3,
        body: [
          {
            kind: "if",
            cond: { kind: "sensor", sensor: "enemyAhead" },
            then: [{ kind: "call", cmd: "attack" }],
            else: [{ kind: "call", cmd: "stepForward" }],
          },
        ],
      },
      { kind: "call", cmd: "turnRight" },
    ];
    expect(roundTrip(program)).toEqual(program);
  });

  it("while と else なし if を復元できる", () => {
    const program: Program = [
      {
        kind: "while",
        cond: { kind: "sensor", sensor: "wallAhead" },
        body: [
          { kind: "if", cond: { kind: "sensor", sensor: "enemyAhead" }, then: [{ kind: "call", cmd: "turnLeft" }] },
        ],
      },
    ];
    expect(roundTrip(program)).toEqual(program);
  });

  it("既存ブロックを消してから読み込む（連続 load で前回が残らない）", () => {
    const ws = new Blockly.Workspace();
    programToWorkspace(ws, [{ kind: "call", cmd: "attack" }]);
    programToWorkspace(ws, [{ kind: "call", cmd: "wait" }]);
    expect(workspaceToProgram(ws)).toEqual([{ kind: "call", cmd: "wait" }]);
  });
});
