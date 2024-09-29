import type { ComponentTabSetting } from "$lib/types/tabSetting";
import Lesson1 from "./Lesson1.svelte";
import Lesson2 from "./Lesson2.svelte";
import Lesson3 from "./Lesson3.svelte";
import Lesson4 from "./Lesson4.svelte";
import Lesson5 from "./Lesson5.svelte";
import Lesson6 from "./Lesson6.svelte";
import Lesson7 from "./Lesson7.svelte";

export async function load(): Promise<{ componentTabSettings: ComponentTabSetting[] }> {
  const componentTabSettings: ComponentTabSetting[] = [
    { index: 1, label: "(Lesson 1)", title: "プログラムを実行してみよう！", component: Lesson1 },
    { index: 2, label: "(Lesson 2)", title: "変数と関数", component: Lesson2 },
    { index: 3, label: "(Lesson 3)", title: "データの型", component: Lesson3 },
    { index: 4, label: "(Lesson 4)", title: "データの配列", component: Lesson4 },
    { index: 5, label: "(Lesson 5)", title: "条件分岐", component: Lesson5 },
    { index: 6, label: "(Lesson 6)", title: "繰り返し(ループ)", component: Lesson6 },
    { index: 7, label: "(Lesson 7)", title: "ループと条件分岐の組み合わせ", component: Lesson7 },
  ];

  return { componentTabSettings };
}
