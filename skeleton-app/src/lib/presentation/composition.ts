/**
 * アプリの合成ルート（Composition Root）。
 *
 * オブジェクトグラフを配線する唯一の場所：
 * インフラ層の具体 Adapter（staticStageRepository）を
 * アプリ層ファサード（createBattleFacade）へ注入する。
 * 依存方向のルール上、この合成ルートだけがプレゼン層がインフラ層を直接 import してよい。
 * 他の画面・コンポーネントは battleFacade 経由でのみ
 * ゲームロジックに触れる（供給元を知らない）。
 *
 * routes の load ではなくモジュール singleton で持つ理由：
 * - ファサードはメソッドを持つため、直列化を前提とする load の戻り値には載せられない。
 * - ファサードはステートレス（注入済み repo 上の純関数群）で、
 *   SSR でもリクエスト跨ぎの状態汚染が起きないため singleton で安全。
 *
 * 可変状態（選択中ステージ等）はここに置かない。
 * ステージ選択は URL（/battle-pod/[stage]）を SSoT とする。
 */

import { createBattleFacade } from "$lib/application";
import type { BattleFacade, Stage } from "$lib/application";
import { staticStageRepository } from "$lib/infrastructure";

/** UI 全体で共有する単一のファサード＝ UI からゲームロジックへの唯一の窓口。 */
export const battleFacade: BattleFacade = createBattleFacade(staticStageRepository);

/** ステージ選択 UI 用の一覧（不変・登録順）。 */
export const stageList: readonly Stage[] = battleFacade.listStages();
