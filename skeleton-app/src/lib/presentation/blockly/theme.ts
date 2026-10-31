/**
 * Blockly のワークスペーステーマ。
 *
 * Blockly はブロック内テキストを SVG へ自前描画するため、CSS の body フォントを継承しない。
 * アプリ全体のレトロゲーム配色（PixelMplus）と揃えるには、ここで fontStyle を明示する必要がある。
 */

import * as Blockly from "blockly";

export const RETRO_THEME = Blockly.Theme.defineTheme("retro", {
  name: "retro",
  // ブロック/カテゴリ色は Classic を踏襲し、フォントだけ差し替える。
  base: Blockly.Themes.Classic,
  fontStyle: {
    family: "'PixelMplus12', monospace",
    weight: "normal",
    size: 12,
  },
});
