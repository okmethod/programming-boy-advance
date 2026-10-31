/**
 * プレゼン層の合成ルート兼ステージ選択状態。
 *
 * 具体 Adapter をファサードに注入し（合成ルート）、選択中ステージ id をリアクティブに共有する。
 * ヘッダー（選択UI）とプレイ面（観戦）が同じ選択を指すための単一の居場所。
 */

import { createBattleFacade } from "$lib/application";
import type { BattleFacade, Stage } from "$lib/application";
import { staticStageRepository } from "$lib/infrastructure";

/** UI 全体で共有する単一のファサード（合成ルート）。 */
export const battleFacade: BattleFacade = createBattleFacade(staticStageRepository);

/** ステージ選択 UI 用の一覧（不変・登録順）。 */
export const stageList: readonly Stage[] = battleFacade.listStages();

// 選択中ステージ id。モジュール越しにリアクティビティを保つため getter/setter で公開する。
let selectedStageId = $state(stageList[0].id);

/** 選択中ステージ id の共有状態。ヘッダーが書き、プレイ面が読む。 */
export const stageSelection = {
  get id(): string {
    return selectedStageId;
  },
  set id(value: string) {
    selectedStageId = value;
  },
};
