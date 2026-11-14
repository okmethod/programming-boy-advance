/**
 * カメの歩み（turtlogo）系統の版ラダー。
 * 移動 → 制御 → 攻撃の順に開花するプレイヤー素質。
 *
 * 版を上げるほど付与命令が広がる（後方互換: 上位版 ⊇ 下位版）。
 * 各版の「できること」は docs/game-rules/base-images.md を正とする。
 */

import type { BaseImage } from "../model";

/**
 * 1.0: 基本の行動のみ。
 *
 * 移動・向き変え・待機のみ。Chap1 は攻撃不可で、位置取りのみでクリア可能。
 */
export const TURTLOGO_V1: BaseImage = {
  imageName: "turtlogo",
  family: "カメの歩み",
  version: "1.0",
  icon: "mdi:turtle",
  summary: "基本の行動だけ。決まった順に動く",
  commands: ["stepForward", "turnRight", "turnLeft", "wait"],
  queries: [],
  controls: [],
};

/**
 * 2.0: 制御の獲得。
 *
 * v1.0 の基本行動に、クエリ（センサ）と制御構文（条件分岐・くりかえし）を足す。
 */
export const TURTLOGO_V2: BaseImage = {
  ...TURTLOGO_V1,
  version: "2.0",
  summary: "まわりを見て、条件分岐とくりかえしで判断できる",
  queries: ["enemyAhead", "wallAhead"],
  controls: ["if", "repeat", "while"],
};

/**
 * 3.0: 攻撃の獲得。
 *
 * 移動（v1）・制御（v2）を経て、最後に攻撃を覚える。
 * 移動系統に攻撃を足す当面の措置＝将来「攻撃系統」を分けるなら attack をそちらへ移す余地あり（YAGNI）。
 */
export const TURTLOGO_V3: BaseImage = {
  ...TURTLOGO_V2,
  version: "3.0",
  summary: "攻撃を覚える。移動・制御に加えて戦える",
  commands: [...TURTLOGO_V2.commands, "attack"],
};
