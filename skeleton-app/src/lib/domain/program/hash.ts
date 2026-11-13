/**
 * 命令木（プログラム）の内容等価判定。
 *
 * 中身が同じプログラムを等価とみなす content-addressable な比較（ワークベンチのダーティー判定等に使う）。
 * イメージの内容指紋（imageHash）は素質も含めた同一性を見るので image 側に置く＝ここは program 単体の等価のみ。
 */

import type { Program } from "./program";

/**
 * 命令木の内容等価（content-addressable な一致判定）。中身が同じなら true。
 * ハッシュ衝突に依らず正確に判定したいので、指紋比較ではなく構造の文字列化で突き合わせる
 * （命令木は順序のある素直な JSON なので文字列化比較で十分・YAGNI）。
 */
export const areProgramsEqual = (a: Program, b: Program): boolean => JSON.stringify(a) === JSON.stringify(b);
