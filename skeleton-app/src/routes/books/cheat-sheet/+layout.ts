import type { SlotTabSetting } from "$lib/types/tabSetting";

export async function load(): Promise<{ slotTabSettings: SlotTabSetting[] }> {
  const slotTabSettings: SlotTabSetting[] = [
    { index: 0, label: "(Index)", title: "チートシート", path: "" },
    { index: 1, label: "(Dictionary)", title: "よく使うプログラムの用語集", path: "dictionary" },
    { index: 2, label: "(Snippet)", title: "よく使うプログラムの書き方", path: "snippet" },
  ];

  return { slotTabSettings };
}
