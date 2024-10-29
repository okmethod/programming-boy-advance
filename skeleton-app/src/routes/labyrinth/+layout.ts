import type { SlotTabSetting } from "$lib/types/tabSetting";

export async function load(): Promise<{ slotTabSettings: SlotTabSetting[] }> {
  const slotTabSettings: SlotTabSetting[] = [
    { index: 0, label: "(Index)", title: "迷路リスト", path: "" },
    { index: 3, label: "(room 3)", title: "迷路", path: "easy" },
  ];

  return { slotTabSettings };
}
