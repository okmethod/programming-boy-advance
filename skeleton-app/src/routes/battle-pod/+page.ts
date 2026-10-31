// ステージ無しの /battle-pod は成立しない（ステージは battle-pod の必須文脈）。選択画面へ戻す。
import { redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import type { PageLoad } from "./$types";

export const load: PageLoad = () => {
  redirect(307, resolve("/stage-select"));
};
