import { describe, it, expect } from "vitest";
import { parseStageMap } from "./stage-map";
import { formatStageLab, labStageFromMap, runStageLab } from "./stage-lab";
import { fwd } from "./stage-test-kit";

describe("runStageLab", () => {
  it("候補ごとの勝敗・CP・クロック数と、ally が通ったマスの軌跡を返す", () => {
    const stage = labStageFromMap(parseStageMap("+---+---+---+\n| A>  .   E<|\n+---+---+---+"));
    const [row] = runStageLab(stage, { forward: [fwd] });
    expect(row).toMatchObject({ name: "forward", winner: "ally", cost: 1 });
    expect(row.trail).toEqual(["0,0", "1,0"]);
    expect(formatStageLab(stage, [row])).toContain("WIN  cp=1");
  });
});
