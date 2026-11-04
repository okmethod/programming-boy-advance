/**
 * 素質（BaseImage）＝オートマトンの土台。
 *
 * オートマトン＝素質＋プログラム＋リソース。素質は「何が得意か（系統）× どこまで開花したか（版）」で、
 * 使える命令セット（＝付与ブロック集合）を定める器。docs/game-rules/base-images.md を正とする。
 *
 * 命名は A面語（JP の系統名）を正とし、EN 識別子（＝FROM のイメージ名）と版タグを併記する。
 * アイコンは「どの動物か」を UI で担保する素質同定の一部なので、この自己記述に同梱する
 * （mdi 名は識別子であり描画依存ではない）。単価・解放スケジュールは本型の責務外（params / レベルデザイン）。
 */

import type { CommandName, SensorName } from "../models/program";

/** 素質が付与しうる制御構文（ドメインの Stmt.kind に対応。if は else 有無を含む）。 */
export type ControlName = "if" | "repeat" | "while";

/** 素質（系統×版）。付与する命令セットがこの素質の「できること」を定める。 */
export interface BaseImage {
  // EN 識別子（B面＝FROM のイメージ名）。例: "turtlogo"。
  readonly imageName: string;
  // A面の系統名（JP・正）。例: "カメの歩み"。
  readonly family: string;
  // 版タグ（メジャー.マイナー）。例: "1.0"。版を上げると命令が広がり単価が下がる。
  readonly version: string;
  // 系統を UI で示す mdi アイコン名。アイコン＋JP名で「どの動物か」を担保する。
  readonly icon: string;
  // 付与する命令セット（＝素質の能力）。ツールボックス生成の seam（固定定義をここから駆動する）。
  readonly commands: readonly CommandName[];
  readonly queries: readonly SensorName[];
  readonly controls: readonly ControlName[];
}

/** A面の表示タグ（imageName:version）。例: "turtlogo:1.0"。 */
export function baseImageTag(base: BaseImage): string {
  return `${base.imageName}:${base.version}`;
}

/**
 * カメの歩み（turtlogo）1.0 ＝ 基本の行動のみ。
 *
 * コマンド（命令）族だけを付与し、クエリ・制御は未獲得。版を上げると開花する（→ v2.0）。
 * loadAttack はブロック未提供なので含めない。
 */
export const TURTLOGO_V1: BaseImage = {
  imageName: "turtlogo",
  family: "カメの歩み",
  version: "1.0",
  icon: "mdi:turtle",
  commands: ["stepForward", "turnRight", "turnLeft", "attack", "wait"],
  queries: [],
  controls: [],
};

/**
 * カメの歩み（turtlogo）2.0 ＝ 制御の獲得（メジャー開花）。
 *
 * v1.0 にクエリ（センサ）と制御構文（条件分岐・くりかえし）を足す。
 * 付与命令セットは現行ツールボックスの全ブロックに一致する（旧 toolbox と同一の見た目）。
 */
export const TURTLOGO_V2: BaseImage = {
  ...TURTLOGO_V1,
  version: "2.0",
  queries: ["enemyAhead", "wallAhead"],
  controls: ["if", "repeat", "while"],
};

/** 素質カタログ（選択候補）。版が上がるほど使える命令が広がる（v1=基本行動 → v2=クエリ＋制御）。 */
export const BASE_IMAGES: readonly BaseImage[] = [TURTLOGO_V1, TURTLOGO_V2];

/**
 * 既定の素質。表示のフォールバック（プリセット／観戦の敵／カレント）に使う。
 * プリセット等は制御・クエリを使うため、フル機能の v2.0 を既定に据える。
 */
export const DEFAULT_BASE_IMAGE: BaseImage = TURTLOGO_V2;
