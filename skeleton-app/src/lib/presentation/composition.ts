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

import { createBattleFacade, createRegistryFacade } from "$lib/application";
import type { BattleFacade, RegistryFacade, Stage } from "$lib/application";
import { localStorageRegistryRepository, staticStageRepository } from "$lib/infrastructure";

/** UI 全体で共有する単一のファサード＝ UI からゲームロジックへの唯一の窓口。 */
export const battleFacade: BattleFacade = createBattleFacade(staticStageRepository);

/** ステージ選択 UI 用の一覧（不変・登録順）。 */
export const stageList: readonly Stage[] = battleFacade.listStages();

/** 手持ちイメージ操作の単一窓口。読みは registryImages（readonly store）を `$`購読する。 */
export const registryFacade: RegistryFacade = createRegistryFacade(localStorageRegistryRepository);

// 起動時に永続化済みの手持ちを state へ復元する（ブラウザのみ実際に読み込む＝adapter が typeof で判定）。
// SSR/プリレンダ時は no-op でプリセットのみの初期シードのまま。
registryFacade.restore();
