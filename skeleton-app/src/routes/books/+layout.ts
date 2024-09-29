import type { SlotTabSetting } from "$lib/types/tabSetting";

export async function load(): Promise<{ slotTabSettings: SlotTabSetting[] }> {
  const slotTabSettings: SlotTabSetting[] = [
    { index: 0, label: "(Index)", title: "Bookリスト", path: "" },
    { index: 1, label: "(Book 1)", title: "チートシート", path: "cheat-sheet" },
    { index: 2, label: "(Book 2)", title: "プログラムの基礎", path: "pgm-basis" },
  ];

  return { slotTabSettings };
}
