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

/** オートマトンイメージ＝素質とプログラムの不変ペア（ビルド済みの最小実体）。 */
export interface AutomatonImage {
  readonly program: Program;
  readonly baseImage: BaseImage;
}

/**
 * イメージの content-addressable な同一性＝program の中身＋素質（系統×版）。
 * baseImage は表示フィールド（icon/summary 等）を持つので丸ごとは混ぜず、identity（imageName×version）だけを混ぜる
 * ＝表示項目を足しても指紋が揺れない。素質が戦闘に効く構想があるため、program 単体ではなくこのイメージ単位で同一性を見る。
 */
const imageIdentity = (image: AutomatonImage): string =>
  JSON.stringify([image.program, image.baseImage.imageName, image.baseImage.version]);

/**
 * イメージの内容指紋＝同一性（program＋素質）の content-addressable ハッシュ
 * （FNV-1a 32bit を 8 桁 hex で）。
 * 中身が同じなら同じ指紋（A面に名前と並べて見せる短い指紋）。
 * B面の種明かし: これは中身の簡易ハッシュで、実コンテナの digest（sha256・マニフェスト単位で、
 * ローカル image ID とも別物）とは異なる＝「ダイジェスト≠ハッシュ」。名前＝タグ（可動ラベル）も併せて明かす。
 * 派生値なので格納せず、必要なところでこの関数から都度算出する（キャッシュの不整合を持たない）。
 */
export const imageHash = (image: AutomatonImage): string => {
  const json = imageIdentity(image);
  let h = 0x811c9dc5; // FNV-1a offset basis
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  return (h >>> 0).toString(16).padStart(8, "0");
};

/**
 * イメージの内容等価（content-addressable な一致判定）。program＋素質が同じなら true。
 * ハッシュ衝突に依らず正確に判定したいので、指紋比較ではなく identity 文字列で突き合わせる。
 */
export const areImagesEqual = (a: AutomatonImage, b: AutomatonImage): boolean => imageIdentity(a) === imageIdentity(b);
