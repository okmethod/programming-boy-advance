/**
 * 素質カタログ（素質の実データ）のバレル。系統ごとのファイルを束ね、プレイヤー選択候補 BASE_IMAGES を組み立てる。
 * image バレルはここ経由でカタログを公開する。敵（enemy）は選択候補に含めず定数のみ公開する。
 */

import type { BaseImage } from "../model";
import { TURTLOGO_V1, TURTLOGO_V2, TURTLOGO_V3 } from "./turtle";

export { TURTLOGO_V1, TURTLOGO_V2, TURTLOGO_V3 } from "./turtle";
export { BRITTLE_SENTRY } from "./enemy";

/** 素質カタログ（プレイヤーの選択候補）。版が上がるほど使える命令が広がる（v1=基本行動 → v2=クエリ＋制御 → v3=攻撃）。 */
export const BASE_IMAGES: readonly BaseImage[] = [TURTLOGO_V1, TURTLOGO_V2, TURTLOGO_V3];
