import { describe, it, expect } from "vitest";
import { serializeRegistry, deserializeRegistry } from "./localStorageRegistryRepository";
import type { PersistedRegistry } from "#lib/application";

const sample: PersistedRegistry = {
  seq: 2,
  images: [
    {
      id: "user:1",
      label: "イメージ 1",
      program: [{ kind: "call", cmd: "stepForward" }],
      baseRef: { imageName: "turtlogo", version: "2.0" },
      pushedAt: 1730000000000,
    },
    {
      id: "user:2",
      label: "突撃",
      program: [{ kind: "call", cmd: "attack" }],
      baseRef: { imageName: "turtlogo", version: "1.0" },
      pushedAt: 1730000001000,
    },
  ],
};

describe("registry codec", () => {
  it("serialize → deserialize でラウンドトリップする", () => {
    const restored = deserializeRegistry(serializeRegistry(sample));
    expect(restored).toEqual(sample);
  });

  it("未保存（null/空文字）は null", () => {
    expect(deserializeRegistry(null)).toBeNull();
    expect(deserializeRegistry("")).toBeNull();
  });

  it("壊れた JSON は null（例外を投げない）", () => {
    expect(deserializeRegistry("{ not json")).toBeNull();
  });

  it("スキーマ版が違えば null（読み捨て）", () => {
    const foreign = JSON.stringify({ schema: 999, seq: 1, images: [] });
    expect(deserializeRegistry(foreign)).toBeNull();
  });

  it("壊れた要素は取り込まず、妥当な要素だけ残す", () => {
    const raw = JSON.stringify({
      schema: 1,
      seq: 1,
      images: [sample.images[0], { id: "bad", label: "x" }],
    });
    const restored = deserializeRegistry(raw);
    expect(restored?.images).toEqual([sample.images[0]]);
  });
});
