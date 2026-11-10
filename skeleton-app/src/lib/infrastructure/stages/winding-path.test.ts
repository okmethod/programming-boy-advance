import { describe, it, expect } from "vitest";
import { runBattle, withAllyInitialHp } from "$lib/domain";
import type { Program } from "$lib/domain";
import { WINDING_PATH_STAGE } from "./winding-path";

const fwd = { kind: "call", cmd: "stepForward" } as const;
const right = { kind: "call", cmd: "turnRight" } as const;
const left = { kind: "call", cmd: "turnLeft" } as const;

// 九十九折りを順にたどり、奥の敵の正面セル (3,2) で終わる手書きの道順（攻撃は使わない）。
// 上段を右へ→右端で下へ→中段を左へ→左端で下へ→下段を右へ→敵の正面で停止＝敵が自壊。
const SOLUTION: Program = [fwd, fwd, fwd, right, fwd, right, fwd, fwd, fwd, left, fwd, left, fwd, fwd, fwd];

describe("WINDING_PATH_STAGE", () => {
  it("攻撃を使わず正面に到達するだけで勝てる（敵が自壊・迷路が連結）", () => {
    const state = withAllyInitialHp(WINDING_PATH_STAGE.initial, 3);
    const result = runBattle(state, SOLUTION, WINDING_PATH_STAGE.enemy);
    expect(result.winner).toBe("ally");
  });

  it("壁を無視した直進では敵の正面に到達できない（辺壁が往来を塞いでいる）", () => {
    // 右へ進み続けるだけ＝上段の端で詰まり、敵のいる下段へ降りられない。
    const naive: Program = [{ kind: "repeat", count: 100, body: [fwd] }];
    const state = withAllyInitialHp(WINDING_PATH_STAGE.initial, 3);
    const result = runBattle(state, naive, WINDING_PATH_STAGE.enemy);
    expect(result.winner).not.toBe("ally");
  });
});
