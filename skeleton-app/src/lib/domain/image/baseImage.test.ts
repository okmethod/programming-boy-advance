import { describe, it, expect } from "vitest";
import {
  baseImageFamilies,
  baseImageSupports,
  baseImageAllowed,
  filterBaseImageFamilies,
  highestAllowedImage,
  TURTLOGO_V1,
  TURTLOGO_V2,
  TURTLOGO_V3,
} from "./baseImage";
import type { Program } from "$lib/domain/program/program";

describe("後方互換の原則（同一系統）", () => {
  // 規約: 同一系統では版を上げると付与集合が単調増加（上位版 ⊇ 下位版）。
  // カタログ追加がこの規約を破っていないかを機械的に弾く。
  it("各系統で版昇順に commands/queries/controls が単調増加する", () => {
    for (const family of baseImageFamilies()) {
      for (let i = 1; i < family.versions.length; i++) {
        const prev = family.versions[i - 1];
        const next = family.versions[i];
        const subsetMsg = `${prev.imageName}:v${prev.version} ⊄ ${next.imageName}:v${next.version}`;
        expect(
          prev.commands.every((c) => next.commands.includes(c)),
          subsetMsg,
        ).toBe(true);
        expect(
          prev.queries.every((q) => next.queries.includes(q)),
          subsetMsg,
        ).toBe(true);
        expect(
          prev.controls.every((c) => next.controls.includes(c)),
          subsetMsg,
        ).toBe(true);
      }
    }
  });
});

describe("baseImageSupports（互換性ガード）", () => {
  it("空プログラムはどの素質でも互換", () => {
    expect(baseImageSupports(TURTLOGO_V1, [])).toBe(true);
    expect(baseImageSupports(TURTLOGO_V2, [])).toBe(true);
  });

  it("基本コマンドのみなら下位版(v1)でも互換", () => {
    const p: Program = [{ kind: "call", cmd: "stepForward" }];
    expect(baseImageSupports(TURTLOGO_V1, p)).toBe(true);
  });

  it("制御(if)を使うと v1 は非互換・v2 は互換（ダウングレードで失われる）", () => {
    // 内側コマンドは v2 が賄える stepForward にし、判定を「制御(if)の有無」だけに絞る（attack は v3 以降）。
    const p: Program = [
      { kind: "if", cond: { kind: "sensor", sensor: "enemyAhead" }, then: [{ kind: "call", cmd: "stepForward" }] },
    ];
    expect(baseImageSupports(TURTLOGO_V1, p)).toBe(false);
    expect(baseImageSupports(TURTLOGO_V2, p)).toBe(true);
  });

  it("クエリ(センサ)を使うと v1 は非互換", () => {
    const p: Program = [
      { kind: "while", cond: { kind: "sensor", sensor: "wallAhead" }, body: [{ kind: "call", cmd: "turnRight" }] },
    ];
    expect(baseImageSupports(TURTLOGO_V1, p)).toBe(false);
  });
});

describe("ステージ素質制限（許可集合）", () => {
  it("baseImageAllowed＝未指定は無制限・許可集合は版単位で判定する", () => {
    expect(baseImageAllowed(TURTLOGO_V3, undefined)).toBe(true); // 未指定＝無制限
    expect(baseImageAllowed(TURTLOGO_V1, [TURTLOGO_V1])).toBe(true);
    expect(baseImageAllowed(TURTLOGO_V2, [TURTLOGO_V1])).toBe(false); // 許可外
  });

  it("filterBaseImageFamilies＝許可版だけを残し、残り版が無い系統は落とす", () => {
    const families = baseImageFamilies();
    const only1 = filterBaseImageFamilies(families, [TURTLOGO_V1]);
    const turtlogo = only1.find((f) => f.imageName === "turtlogo");
    expect(turtlogo?.versions.map((v) => v.version)).toEqual(["1.0"]);
    // 未指定は無制限でそのまま。
    expect(filterBaseImageFamilies(families, undefined)).toEqual(families);
  });

  it("highestAllowedImage＝許可集合のうち最も版が進んだ素質（クランプ先）", () => {
    expect(highestAllowedImage([TURTLOGO_V1])?.version).toBe("1.0");
    expect(highestAllowedImage([TURTLOGO_V1, TURTLOGO_V2])?.version).toBe("2.0");
    expect(highestAllowedImage([])).toBeUndefined();
  });
});
