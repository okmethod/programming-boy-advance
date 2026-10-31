/**
 * アプリ画面（ルート）の一覧と表示名。
 *
 * ヘッダー中央に出す「現在のページ名」の SSoT。画面名は A面語＝ユビキタス言語なので一箇所に集約する。
 * キーは SvelteKit のルート id（base path 非依存）で、ホーム "/(root)" は中央に出さない（左のブランドで足りる）。
 */

export interface AppRoute {
  // SvelteKit のルート id（例 "/sandbox"）。page.route.id と突き合わせる。
  readonly id: string;
  // ヘッダー中央に出す画面名。
  readonly title: string;
}

export const APP_ROUTES: readonly AppRoute[] = [
  { id: "/stage-select", title: "Stage Select" },
  { id: "/battle-pod/[stage]", title: "Automaton BattlePod" },
  { id: "/sandbox", title: "Automaton Sandbox" },
];

/** ルート id から画面名を引く（該当なし＝ホーム等は空文字＝中央非表示）。 */
export function pageTitle(routeId: string | null): string {
  return APP_ROUTES.find((route) => route.id === routeId)?.title ?? "";
}
