/**
 * カメの歩み（turtlogo）系統の版ラダー。
 *
 * 1 版につき新ブロックを 1 系統ずつ開花するプレイヤー素質。
 *
 * 版を上げるほど付与命令が広がる（後方互換: 上位版 ⊇ 下位版）。
 * 各版の「できること」は docs/game-rules/base-images.md を正とする。
 */

import type { BaseImage } from "../model";

/**
 * 1.0: 基本の行動のみ。
 *
 * 移動・向き変え・待機のみ。決まった順に動く（制御・クエリ・攻撃は持たない）。
 */
export const TURTLE_V1: BaseImage = {
  imageName: "turtlogo",
  family: "カメの歩み",
  version: "1.0",
  icon: "mdi:turtle",
  summary: "基本の行動だけ。決まった順に動く",
  commands: ["stepForward", "turnRight", "turnLeft", "wait"],
  queries: [],
  controls: [],
  operators: [],
};

/**
 * 2.0: くりかえしの獲得。
 *
 * v1.0 の基本行動に制御構文（くりかえし）を足す。条件は literal のみ（`ずっとくりかえす`＝while(true)）で、
 * クエリで分岐するのは v3.0 から。
 */
export const TURTLE_V2: BaseImage = {
  ...TURTLE_V1,
  version: "2.0",
  summary: "くりかえしを覚える。同じ動きをまとめられる",
  controls: ["repeat", "while"],
};

/**
 * 3.0: 条件分岐とクエリの獲得。
 *
 * v2.0 のくりかえしに、空間センサ（wallAhead）と条件分岐（if）を足す。まわりを読んで判断して動ける。
 * 敵センサ（enemyAhead）は攻撃と組んで初めて効く戦闘の道具なので、この版ではなく攻撃版(v5)で開花する。
 */
export const TURTLE_V3: BaseImage = {
  ...TURTLE_V2,
  version: "3.0",
  summary: "まわりを見て、条件分岐で判断できる",
  queries: ["wallAhead"],
  controls: ["repeat", "while", "if"],
};

/**
 * 4.0: 周囲認識と否定の獲得（迷路）。
 *
 * v3.0 の前方センサ（wallAhead）に、左右の壁センサ（wallLeft/wallRight）と否定（not）を足す。
 * 入れ子の条件分岐と組み合わせ、壁沿い法で任意の単純迷路を抜けられる。
 */
export const TURTLE_V4: BaseImage = {
  ...TURTLE_V3,
  version: "4.0",
  summary: "左右も見て、否定で条件を組める。迷路を抜けられる",
  queries: [...TURTLE_V3.queries, "wallLeft", "wallRight"],
  operators: ["not"],
};

/**
 * 5.0: 攻撃の獲得。
 *
 * 移動（v1）・くりかえし（v2）・条件分岐＋クエリ（v3）・迷路（v4）を経て、最後に攻撃を覚える。
 * 攻撃と対になる敵センサ（enemyAhead）もこの版で開花する（「前に敵がいれば攻撃」が組める）。
 * 移動系統に攻撃を足す当面の措置＝将来「攻撃系統」を分けるなら attack をそちらへ移す余地あり（YAGNI）。
 */
export const TURTLE_V5: BaseImage = {
  ...TURTLE_V4,
  version: "5.0",
  summary: "攻撃を覚える。移動・制御・クエリに加えて戦える",
  queries: [...TURTLE_V4.queries, "enemyAhead"],
  commands: [...TURTLE_V4.commands, "attack"],
};

/** カメの歩み（turtlogo）系統の版ラダー（版の昇順）。系統単位で束ねた列。 */
export const TURTLE_IMAGES: readonly BaseImage[] = [TURTLE_V1, TURTLE_V2, TURTLE_V3, TURTLE_V4, TURTLE_V5];
