import type { SlotTabSetting } from "$lib/types/tabSetting";

export async function load(): Promise<{ slotTabSettings: SlotTabSetting[] }> {
  const slotTabSettings: SlotTabSetting[] = [
    { index: 0, label: "(Index)", title: "プログラミングの基礎", path: "" },
    { index: 1, label: "(Lesson 1)", title: "プログラムを実行してみよう！", path: "hello-world" },
    { index: 2, label: "(Lesson 2)", title: "変数と関数", path: "vars-and-functions" },
    { index: 3, label: "(Lesson 3)", title: "データの型", path: "data-type" },
    { index: 4, label: "(Lesson 4)", title: "データの配列", path: "data-array" },
    { index: 5, label: "(Lesson 5)", title: "条件分岐", path: "if-branch" },
    { index: 6, label: "(Lesson 6)", title: "繰り返し(ループ)", path: "for-loop" },
    { index: 7, label: "(Lesson 7)", title: "ループと条件分岐の組み合わせ", path: "if-and-for" },
  ];

  return { slotTabSettings };
}
