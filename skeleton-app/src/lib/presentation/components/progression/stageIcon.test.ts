import { describe, expect, it } from "vitest";
import { stageIcon } from "./stageIcon";

describe("stageIcon", () => {
  it("open は選択で塗り、非選択で outline になる", () => {
    expect(stageIcon("open", true)).toBe("mdi:file");
    expect(stageIcon("open", false)).toBe("mdi:file-outline");
  });

  it("cleared はチェック付き、選択で塗り分ける", () => {
    expect(stageIcon("cleared", true)).toBe("mdi:file-check");
    expect(stageIcon("cleared", false)).toBe("mdi:file-check-outline");
  });

  it("locked は選択に依らず lock（選択不可）", () => {
    expect(stageIcon("locked", true)).toBe("mdi:file-lock-outline");
    expect(stageIcon("locked", false)).toBe("mdi:file-lock-outline");
  });
});
