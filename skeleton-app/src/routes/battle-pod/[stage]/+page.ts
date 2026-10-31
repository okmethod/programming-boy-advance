// ステージ id は URL（パスパラメータ）が SSoT。不正・未知の id は選択画面へ戻す。
import { redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";
import { battleFacade } from "$lib/presentation/composition";
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params }) => {
  const stageId = params.stage;
  try {
    // getStage は未知 id で例外。存在確認だけを行い、描画は +page.svelte に委ねる。
    battleFacade.getStage(stageId);
  } catch {
    redirect(307, resolve("/stage-select"));
  }
  return { stageId };
};
