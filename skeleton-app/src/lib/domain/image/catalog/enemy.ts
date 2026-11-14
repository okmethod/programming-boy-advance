/**
 * 敵専用の素質（プレイヤーカタログ外）。
 *
 * BASE_IMAGES には載せない＝ツールボックス/ブロックに漏れない。
 * 今は版ラダーを持たない単体の敵のみ。将来、敵が版で成長するなら系統ごとのファイルへ割り直す。
 */

import type { BaseImage } from "../model";

/**
 * brittleAttack だけを持つ初期型の敵（Chap1 の「脆弱性を突いて勝つ」敵）。敵プログラム表示の土台。
 *
 * brittleAttack は命中時に自分が自壊する暴発（→ engine）。
 * 敵は `while(true){ brittleAttack }` で無心に振り続け、自キャラが正面に立つと自壊する。
 */
export const BRITTLE_SENTRY: BaseImage = {
  imageName: "brittle",
  family: "バグったオートマトン",
  version: "1.0",
  icon: "mdi:robot-confused",
  summary: "正面に立たれると自壊する（脆弱性あり）",
  commands: ["brittleAttack"],
  queries: [],
  controls: ["while"],
};
