import type { SlotTabSetting } from "$lib/types/tabSetting";

export async function load(): Promise<{ slotTabSettings: SlotTabSetting[] }> {
  const slotTabSettings: SlotTabSetting[] = [
    { index: 0, label: "(Index)", title: "迷路リスト", path: "" },
    { index: 1, label: "(room 1)", title: "入口", path: "room1" },
  ];

  return { slotTabSettings };
}
