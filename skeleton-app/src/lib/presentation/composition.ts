/**
 * アプリの合成ルート（Composition Root）。
 *
 * @architecture レイヤー間依存ルール - プレゼン層（外縁）
 * - ROLE: 描画・ブロック UI・操作の受付
 * - ALLOWED: アプリ層（$lib/application）への依存のみ
 * - FORBIDDEN: ドメイン層（$lib/domain）・インフラ層（$lib/infrastructure）への直接依存
 *   - 型/定数はアプリ層バレルの re-export 経由で取る（$lib/domain 直 import 禁止・lint で強制）
 *   - 例外: プレゼン層では、この合成ルートだけがインフラ層を直接 import してよい。
 * - 単一バレルを持たない層のため、層全体のルールは代表してこのファイルに記す
 *
 * オブジェクトグラフを配線する唯一の場所：
 * インフラ層の具体 Adapter をアプリ層 Facade に注入する。
 * 他の画面・コンポーネントは Facade 経由でのみゲームロジックに触れる（供給元を知らない）。
 *
 * routes の load ではなくモジュール singleton で持つ理由：
 * - Facade はメソッドを持つため、直列化を前提とする load の戻り値には載せられない。
 * - Facade はステートレス（注入済み repo 上の純関数群）で、
 *   SSR でもリクエスト跨ぎの状態汚染が起きないため singleton で安全。
 */

import { createBattleFacade, createRegistryFacade } from "$lib/application";
import type { BattleFacade, Chapter, RegistryFacade } from "$lib/application";
import { localStorageRegistryRepository, staticStageRepository } from "$lib/infrastructure";

/** UI 全体で共有する単一の Facade ＝ UI からゲームロジックへの唯一の窓口。 */
export const battleFacade: BattleFacade = createBattleFacade(staticStageRepository);

/** ステージ選択 UI 用のチャプター一覧（不変・登録順）。章ごとにステージを束ねて持つ。 */
export const chapterList: readonly Chapter[] = battleFacade.listChapters();

/** 手持ちイメージ操作の単一窓口。読みは registryImages（readonly store）を `$`購読する。 */
export const registryFacade: RegistryFacade = createRegistryFacade(localStorageRegistryRepository);

// 起動時に永続化済みの手持ちを state へ復元する（ブラウザのみ実際に読み込む＝adapter が typeof で判定）。
// SSR/プリレンダ時は no-op でプリセットのみの初期シードのまま。
registryFacade.restore();
