import type { SlotTabSetting } from "$lib/types/tabSetting";

export async function load(): Promise<{ slotTabSettings: SlotTabSetting[] }> {
  const slotTabSettings: SlotTabSetting[] = [
    { index: 0, label: "(Index)", title: "迷路リスト", path: "" },
    { index: 1, label: "(room 1)", title: "玄関口", path: "entrance" },
    { index: 2, label: "(room 2)", title: "曲がり角", path: "corner" },
    { index: 3, label: "(room 3)", title: "迷路", path: "easy" },
  ];

  return { slotTabSettings };
}
