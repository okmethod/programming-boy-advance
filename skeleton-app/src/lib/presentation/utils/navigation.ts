import { goto } from "$app/navigation";
import { resolve } from "$app/paths";

// SvelteKit v3 で $app/paths の base export は廃止。resolve が base path を考慮して解決する。
// resolve は生成ルートの union 型に厳格で、動的に組み立てた base 相対パス文字列を受け付けない。
// 本アプリは常に "/..." 形式の絶対パスを渡し、runtime の resolve が正しく base を付与する。
const resolvePath = resolve as (path: string) => string;

export function navigateTo(path: string) {
  // resolvePath は resolve のエイリアスだが、lint ルールは識別子 resolve を直接要求するため個別に無効化する
  // eslint-disable-next-line svelte/no-navigation-without-resolve
  return goto(resolvePath(path));
}
