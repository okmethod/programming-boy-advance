/**
 * 命令木（プログラム）の内容フィンガープリント。
 *
 * 中身が同じプログラムは同じ指紋になる content-addressable な短いハッシュ（A面に名前と並べて見せる）。
 * B面の種明かし: これは中身の簡易ハッシュで、実コンテナの digest（sha256・マニフェスト単位で、
 * ローカル image ID とも別物）とは異なる＝「ダイジェスト≠ハッシュ」。名前＝タグ（可動ラベル）も併せて明かす。
 */

import type { Program } from "$lib/domain/models/program";

/** 命令木の内容ハッシュ（FNV-1a 32bit を 8 桁 hex で）。中身が同じなら同じ指紋。 */
export const hashProgram = (program: Program): string => {
  const json = JSON.stringify(program);
  let h = 0x811c9dc5; // FNV-1a offset basis
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  return (h >>> 0).toString(16).padStart(8, "0");
};
