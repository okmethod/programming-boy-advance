import { describe, it, expect } from "vitest";
import {
  baseImageFamilies,
  baseImageSupports,
  baseImageAllowed,
  filterBaseImageFamilies,
  highestAllowedImage,
} from "./baseImage";
import { TURTLE_V1, TURTLE_V2, TURTLE_V3 } from "./catalog";
import type { Program } from "#lib/domain/program";

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
    expect(baseImageSupports(TURTLE_V1, [])).toBe(true);
    expect(baseImageSupports(TURTLE_V2, [])).toBe(true);
  });

  it("基本コマンドのみなら下位版(v1)でも互換", () => {
    const p: Program = [{ kind: "call", cmd: "stepForward" }];
    expect(baseImageSupports(TURTLE_V1, p)).toBe(true);
  });

  it("くりかえし(while/literal)は v1 は非互換・v2 で互換（条件が literal なら分岐不要）", () => {
    // ずっとくりかえす（while(true)）＝折り返し道の想定解。制御はあるがクエリ・条件分岐は要らない。
    const p: Program = [
      { kind: "while", cond: { kind: "literal", value: true }, body: [{ kind: "call", cmd: "stepForward" }] },
    ];
    expect(baseImageSupports(TURTLE_V1, p)).toBe(false);
    expect(baseImageSupports(TURTLE_V2, p)).toBe(true);
  });

  it("条件分岐(if)＋センサは v1/v2 では非互換・v3 で互換（ダウングレードで失われる）", () => {
    // 内側コマンドは v3 が賄える stepForward にし、判定を「条件分岐(if)＋センサの有無」に絞る（attack は v4 以降）。
    const p: Program = [
      { kind: "if", cond: { kind: "sensor", sensor: "enemyAhead" }, then: [{ kind: "call", cmd: "stepForward" }] },
    ];
    expect(baseImageSupports(TURTLE_V1, p)).toBe(false);
    expect(baseImageSupports(TURTLE_V2, p)).toBe(false);
    expect(baseImageSupports(TURTLE_V3, p)).toBe(true);
  });

  it("クエリ(センサ)を使うと v1/v2 は非互換（クエリは v3 から）", () => {
    const p: Program = [
      { kind: "while", cond: { kind: "sensor", sensor: "wallAhead" }, body: [{ kind: "call", cmd: "turnRight" }] },
    ];
    expect(baseImageSupports(TURTLE_V1, p)).toBe(false);
    expect(baseImageSupports(TURTLE_V2, p)).toBe(false);
  });
});

describe("ステージ素質制限（許可集合）", () => {
  it("baseImageAllowed＝未指定は無制限・許可集合は版単位で判定する", () => {
    expect(baseImageAllowed(TURTLE_V3, undefined)).toBe(true); // 未指定＝無制限
    expect(baseImageAllowed(TURTLE_V1, [TURTLE_V1])).toBe(true);
    expect(baseImageAllowed(TURTLE_V2, [TURTLE_V1])).toBe(false); // 許可外
  });

  it("filterBaseImageFamilies＝許可版だけを残し、残り版が無い系統は落とす", () => {
    const families = baseImageFamilies();
    const only1 = filterBaseImageFamilies(families, [TURTLE_V1]);
    const turtlogo = only1.find((f) => f.imageName === "turtlogo");
    expect(turtlogo?.versions.map((v) => v.version)).toEqual(["1.0"]);
    // 未指定は無制限でそのまま。
    expect(filterBaseImageFamilies(families, undefined)).toEqual(families);
  });

  it("highestAllowedImage＝許可集合のうち最も版が進んだ素質（クランプ先）", () => {
    expect(highestAllowedImage([TURTLE_V1])?.version).toBe("1.0");
    expect(highestAllowedImage([TURTLE_V1, TURTLE_V2])?.version).toBe("2.0");
    expect(highestAllowedImage([])).toBeUndefined();
  });
});
