/**
 * オートマトンイメージ（中核モデル）＝素質にプログラムを載せた不変の最小実体と、その操作。
 *
 * ユビキタス言語の「オートマトンイメージ」＝素質（baseImage）にプログラム（program）を載せて
 * ビルドした不変スナップショット。試運転・プッシュ・デプロイはすべてこの単位を対象にする。
 * program と baseImage は常に一体で運ぶ（別々に旅させると「どの素質で組んだか」が取り違う）。
 * レジストリ／デプロイ／ビルド断面は、これにユースケース固有メタ（タグ・HP・時刻等）を足した特化形。
 */

import type { Program } from "$lib/domain/models/program";
import type { BaseImage } from "$lib/domain/baseimage/baseImage";
import { hashProgram } from "$lib/domain/program/hash";

/** オートマトンイメージ＝素質とプログラムの不変ペア（ビルド済みの最小実体）。 */
export interface AutomatonImage {
  readonly program: Program;
  readonly baseImage: BaseImage;
}

/**
 * イメージの内容指紋＝program の content-addressable ハッシュ（A面に名前と並べて見せる短い指紋）。
 * baseImage は指紋に含めない＝program が同じなら同一視する（dedup も program 等価で判定する方針に揃える）。
 * 派生値なので格納せず、必要なところでこの関数から都度算出する（キャッシュの不整合を持たない）。
 */
export const imageHash = (image: AutomatonImage): string => hashProgram(image.program);
