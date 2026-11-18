/**
 * チャプター2（迷路）のステージを束ねるバレル。
 */

import type { Stage } from "#lib/application";
import { RIGHT_HOOK_STAGE } from "./right-hook";
import { RIGHT_STEPS_STAGE } from "./right-steps";
import { RIGHT_SPIRAL_STAGE } from "./right-spiral";

export { RIGHT_HOOK_STAGE } from "./right-hook";
export { RIGHT_STEPS_STAGE } from "./right-steps";
export { RIGHT_SPIRAL_STAGE } from "./right-spiral";

/**
 * チャプター2 の学習曲線（リストの並び順＝選択 UI での並び順）。全面カメ v4（左右センサ＋否定）にロック。
 * まず右手センサ（wallRight＋否定）の使い方を、右折のみの基本形を段階的に伸ばして教える（教える→反復→強制）。
 * 各面は ally(0,0)東→東2マス→(2,0)で右折（角の正面に袋小路ダミー）まで同一の兄弟面。
 *
 * 入門（右折のみ・基本形を段階的に伸ばす）:
 * - 右折・対称（右が開けば曲がる＝wallRight + not。脚長対称でベタ書きも可＝最初の1手）
 * - 右折・非対称（基本形を縦に伸ばし脚長を崩す。一様ベタ書きは無効だが脚別は可）
 * - 右折・渦巻き（その2を角にして北へ巻き上げ右折3回。ベタ書きは CP 超過＝センサのループを強制）
 */
export const CHAPTER2_STAGES: readonly Stage[] = [
  RIGHT_HOOK_STAGE, // 右が開いたら右折（対称・ベタ書き可）
  RIGHT_STEPS_STAGE, // 同じ手を非対称な道へ（ベタ書き可だが一様ループは無効）
  RIGHT_SPIRAL_STAGE, // 右折のみの渦巻き（ベタ書きは CP 超過＝ループ強制）
  // TODO: 左折（left-hook）・両方（winding）・迷路（bent-corridor/snake/snake-long）を順次ブラッシュアップして追加する
];
