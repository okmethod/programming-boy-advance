/**
 * 敵専用の素質（プレイヤーカタログ外）。
 *
 * BASE_IMAGES には載せない＝ツールボックス/ブロックに漏れない。
 */

import type { BaseImage } from "../model";

/**
 * brittleAttack だけを持つチュートリアル用の敵。
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
  operators: [],
};

/**
 * 標準的な敵
 */
export const BASIC_SENTRY: BaseImage = {
  imageName: "sentry",
  family: "戦闘用オートマトン",
  version: "1.0",
  icon: "mdi:robot-angry",
  summary: "標準的な戦闘用オートマトン",
  commands: ["stepForward", "turnRight", "turnLeft", "attack", "wait"],
  queries: ["wallAhead", "enemyAhead"],
  controls: ["while", "if"],
  operators: [],
};
