/**
 * チャプター2（迷路）のステージを束ねるバレル。
 */

import type { Stage } from "#lib/application";
import { RIGHT_HOOK_STAGE } from "./right-hook";
import { RIGHT_STEPS_STAGE } from "./right-steps";
import { RIGHT_SPIRAL_STAGE } from "./right-spiral";
import { BENT_CORRIDOR_STAGE } from "./bent-corridor";
import { MAZE_CORRIDOR_STAGE } from "./maze-corridor";
import { MAZE_DEAD_END_STAGE } from "./maze-dead-end";

export { RIGHT_HOOK_STAGE } from "./right-hook";
export { RIGHT_STEPS_STAGE } from "./right-steps";
export { RIGHT_SPIRAL_STAGE } from "./right-spiral";
export { BENT_CORRIDOR_STAGE } from "./bent-corridor";
export { MAZE_CORRIDOR_STAGE } from "./maze-corridor";
export { MAZE_DEAD_END_STAGE } from "./maze-dead-end";

/**
 * チャプター2 の学習曲線（リストの並び順＝選択 UI での並び順）。全面カメ v4（左右センサ＋否定）にロック。
 * まず右手センサ（wallRight＋否定）の使い方を、右折のみの基本形を段階的に伸ばして教え（入門）、
 * 次にそれ無しでは解けない迷路へ適用する（本番＝角ごとに開く向きが違い、ベタ書きは CP 上限を超える）。
 *
 * 入門（右折のみ・基本形を段階的に伸ばす。各面 ally(0,0)東→東2→右折まで同一の兄弟面）:
 * - 右折・対称（右が開けば曲がる＝wallRight + not。脚長対称でベタ書きも可＝最初の1手）
 * - 右折・非対称（基本形を縦に伸ばし脚長を崩す。一様ベタ書きは無効だが脚別は可）
 * - 右折・渦巻き（その2を角にして北へ巻き上げ右折3回。ベタ書きは CP 超過＝センサのループを強制）
 * 迷路（左右センサが必須・ベタ書きは CP 超過）:
 * - 折れ道（右・左・右と折れる。ここで初めて左折を出す。左折は右折と同じ部品で足りるため導入面を設けない）
 * - 迷路（盤の全マスを使ったほぼ一本道。脇道は右手法が入らない位置だけ＝Uターン不要）
 * - 迷路 その2（右側に行き止まりの脇道。右手法は入ってもUターンして戻る＝同じプログラムのまま）
 */
export const CHAPTER2_STAGES: readonly Stage[] = [
  // 入門: 右手センサの使い方を右折のみの道で段階的に教える（教える→反復→強制）
  RIGHT_HOOK_STAGE, // 右が開いたら右折（対称・ベタ書き可）
  RIGHT_STEPS_STAGE, // 同じ手を非対称な道へ（ベタ書き可だが一様ループは無効）
  RIGHT_SPIRAL_STAGE, // 右折のみの渦巻き（ベタ書きは CP 超過＝ループ強制）
  // 迷路: 左右センサが必須・ベタ書きは CP 上限を超える
  BENT_CORRIDOR_STAGE, // 行き止まりで左折を足す折れ道（左折の初出）
  MAZE_CORRIDOR_STAGE, // 同じ右手法で、盤いっぱいのほぼ一本道の迷路を抜ける
  MAZE_DEAD_END_STAGE, // 右側の脇道に入っても、行き止まりでUターンして戻る
  // TODO: 分岐の多い本格迷路・右手法が通じない迷路を追加し、8面にする
];
