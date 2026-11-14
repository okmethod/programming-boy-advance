/**
 * image ドメインの型 SSoT。
 *
 * オートマトンイメージはビルド済みの最小実体で、試運転・プッシュ・デプロイの対象単位。
 * baseImage と program は常に一体で運ぶ（別々に旅させると「どの素質で組んだか」が取り違う）。
 * レジストリ／デプロイ／ビルド断面は、これにユースケース固有メタ（タグ・HP・時刻等）を足した特化形。
 */

import type { CommandName, SensorName, ControlName, Program } from "#lib/domain/program";

/** 素質（系統×版）。付与する命令セットがこの素質の「できること」を定める。 */
export interface BaseImage {
  // EN 識別子（B面＝FROM のイメージ名）。例: "turtlogo"。
  readonly imageName: string;
  // A面の系統名（JP・正）。例: "カメの歩み"。
  readonly family: string;
  // 版（メジャー.マイナー）の数値文字列。例: "1.0"（表示は baseImageTag が "v1.0" に整形）。
  readonly version: string;
  // 系統を UI で示す mdi アイコン名。アイコン＋JP名で「どの動物か」を担保する。
  readonly icon: string;
  // この版の「できること」を一言で表す概要（選択UIのカード説明）。ブロック数より質を伝える。
  readonly summary: string;
  // 付与する命令セット（プログラムブロック）。ツールボックス生成の seam（固定定義をここから駆動する）。
  readonly commands: readonly CommandName[];
  readonly queries: readonly SensorName[];
  readonly controls: readonly ControlName[];
}

/** オートマトンイメージ＝素質とプログラムの不変ペア（ビルド済みの最小実体）。 */
export interface AutomatonImage {
  readonly baseImage: BaseImage;
  readonly program: Program;
}
