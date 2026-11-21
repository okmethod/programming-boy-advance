/**
 * 素質カタログ（素質の実データ）のバレル。系統ごとのファイルを束ね、プレイヤー選択候補 BASE_IMAGES を組み立てる。
 * image バレルはここ経由でカタログを公開する。敵（enemy）は選択候補に含めず定数のみ公開する。
 */

import type { BaseImage } from "../model";
import { TURTLE_IMAGES } from "./turtle";

export { TURTLE_V1, TURTLE_V2, TURTLE_V3, TURTLE_V4, TURTLE_V5, TURTLE_IMAGES } from "./turtle";
export { BRITTLE_SENTRY, BASIC_SENTRY } from "./enemy";

/** 素質カタログ（プレイヤーの選択候補）＝系統ごとの版ラダーを連結した全体。将来の系統はここに足す。 */
export const BASE_IMAGES: readonly BaseImage[] = [...TURTLE_IMAGES];
