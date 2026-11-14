import { beforeEach, describe, it, expect } from "vitest";
import { get } from "svelte/store";
import { UNKNOWN_BASE_IMAGE, TURTLOGO_V1, TURTLOGO_V2, imageHash, type Program } from "#lib/domain";
import type { PersistedRegistry, RegistryRepository } from "#lib/application";
import { createRegistryFacade } from "./facade";
import { registryImages, storeWriter } from "./store";

// 永続化の中身を観測できる in-memory の fake（localStorage 非依存）。
function fakeRepo(initial: PersistedRegistry | null = null) {
  let stored = initial;
  const repo: RegistryRepository = {
    load: () => stored,
    save: (data) => {
      stored = data;
    },
  };
  return {
    repo,
    get saved() {
      return stored;
    },
  };
}

const PROG_A: Program = [{ kind: "call", cmd: "stepForward" }];
const PROG_B: Program = [{ kind: "call", cmd: "attack" }];

// 各テストはプリセットのみ・seq=0 の初期状態から始める（store は singleton のため）。
beforeEach(() => storeWriter.reset([], 0));

// プリセット件数（user を積む前の初期一覧の長さ）。
const presetCount = get(registryImages).length;

describe("registry facade", () => {
  it("push で手持ちが積まれ、自動命名が連番になる", () => {
    const { repo } = fakeRepo();
    const facade = createRegistryFacade(repo);

    facade.push({ program: PROG_A, baseImage: TURTLOGO_V1 });
    facade.push({ program: PROG_B, baseImage: TURTLOGO_V1 });

    const images = get(registryImages);
    expect(images.length).toBe(presetCount + 2);
    expect(images.at(-2)).toMatchObject({ id: "user:1", label: "イメージ 1", source: "user" });
    expect(images.at(-1)).toMatchObject({ id: "user:2", label: "イメージ 2" });
  });

  it("同一内容の push は no-op（content-addressable）", () => {
    const { repo } = fakeRepo();
    const facade = createRegistryFacade(repo);

    facade.push({ program: PROG_A, baseImage: TURTLOGO_V1 });
    facade.push({ program: PROG_A, baseImage: TURTLOGO_V1 }); // 二度目は積まれない

    expect(get(registryImages).length).toBe(presetCount + 1);
  });

  it("同一 program でも素質が違えば別イメージとして積む（同一性は program＋素質）", () => {
    const { repo } = fakeRepo();
    const facade = createRegistryFacade(repo);

    facade.push({ program: PROG_A, baseImage: TURTLOGO_V1 });
    facade.push({ program: PROG_A, baseImage: TURTLOGO_V2 }); // program は同じだが素質が違う

    expect(get(registryImages).length).toBe(presetCount + 2);
  });

  it("save は user の手持ちだけを baseRef に落として渡す（プリセットは含めない）", () => {
    const store = fakeRepo();
    const facade = createRegistryFacade(store.repo);

    facade.push({ program: PROG_A, baseImage: TURTLOGO_V1 }, "自作");

    expect(store.saved).toEqual({
      seq: 1,
      images: [
        {
          id: "user:1",
          label: "自作",
          program: PROG_A,
          baseRef: { imageName: "turtlogo", version: "1.0" },
          pushedAt: expect.any(Number),
        },
      ],
    });
  });

  it("preset は rename/remove できない（読み取り専用）", () => {
    const { repo } = fakeRepo();
    const facade = createRegistryFacade(repo);
    const presetId = get(registryImages)[0].id;

    facade.rename(presetId, "改名");
    facade.remove(presetId);

    expect(get(registryImages)[0].id).toBe(presetId);
    expect(get(registryImages)[0].label).not.toBe("改名");
  });

  it("restore は baseRef を実体へ復元し、hash を再計算し、seq を引き継ぐ", () => {
    const { repo } = fakeRepo({
      seq: 5,
      images: [
        {
          id: "user:5",
          label: "復元",
          program: PROG_B,
          baseRef: { imageName: "turtlogo", version: "9.9" }, // 未知版
          pushedAt: 123,
        },
      ],
    });
    const facade = createRegistryFacade(repo);

    facade.restore();

    const restored = get(registryImages).at(-1)!;
    expect(restored.baseImage).toEqual(UNKNOWN_BASE_IMAGE); // 未知版は UNKNOWN に落ちる
    // 指紋は program＋素質から算出（格納しない）。復元した素質（UNKNOWN）込みで一致する。
    expect(imageHash(restored)).toBe(imageHash({ program: PROG_B, baseImage: UNKNOWN_BASE_IMAGE }));
    expect(restored.source).toBe("user");

    // 以降の push は復元した seq の続きから採番される。
    facade.push({ program: PROG_A, baseImage: TURTLOGO_V1 });
    expect(get(registryImages).at(-1)!.id).toBe("user:6");
  });
});
