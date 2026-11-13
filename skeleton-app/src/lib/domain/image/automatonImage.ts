/**
 * オートマトンイメージ（概念）＝素質にプログラムを載せた不変の最小実体と、その操作。
 *
 * ユビキタス言語の「オートマトンイメージ」＝素質（baseImage）にプログラム（program）を載せて
 * ビルドした不変スナップショット。試運転・プッシュ・デプロイはすべてこの単位を対象にする。
 * program と baseImage は常に一体で運ぶ（別々に旅させると「どの素質で組んだか」が取り違う）。
 * レジストリ／デプロイ／ビルド断面は、これにユースケース固有メタ（タグ・HP・時刻等）を足した特化形。
 *
 * イメージ概念ディレクトリ（image/）。同居の baseImage（素質）と、program 型・program/hash 操作に依存する。
 */

import type { Program } from "$lib/domain/program";
import type { BaseImage } from "./baseImage";
import { hashProgram } from "$lib/domain/program";

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
