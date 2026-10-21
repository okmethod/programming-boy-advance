/**
 * カスタムブロック定義と toolbox（プレゼン層：ブロックUI）。
 *
 * ブロックが出す語は A面（プレイヤー向けの親しみやすい一般語）。
 * ドロップダウンやブロック種別の「値」は B面
 * （ドメインの実名 = CommandName / SensorName / Stmt.kind）で、
 * この対応づけが toProgram.ts での命令木生成の土台になる。
 * 対応表は overview.md / plan を正とする。
 */

import * as Blockly from "blockly";

// センサのドロップダウン選択肢。[A面ラベル, B面の値(SensorName)] の順。
const SENSOR_OPTIONS: [string, string][] = [
  ["敵が近い?", "enemyAhead"],
  ["壁がある?", "wallAhead"],
];

// 配色（Blockly の HSV 色相）。うごき=緑系 / 制御=橙系。
const COLOUR_COMMAND = 160;
const COLOUR_CONTROL = 30;

// コマンド5種。previous/next 接続のみ持つ単純ブロック。block.type → CommandName に対応。
const COMMAND_BLOCKS: { type: string; label: string }[] = [
  { type: "cmd_stepForward", label: "前に進む" },
  { type: "cmd_turnRight", label: "右を向く" },
  { type: "cmd_turnLeft", label: "左を向く" },
  { type: "cmd_attack", label: "攻撃する" },
  { type: "cmd_wait", label: "待機する" },
];

// block.type からコマンド名を取り出す接頭辞（toProgram でも使う）。
export const COMMAND_PREFIX = "cmd_";

const COMMAND_DEFS = COMMAND_BLOCKS.map(({ type, label }) => ({
  type,
  message0: label,
  previousStatement: null,
  nextStatement: null,
  colour: COLOUR_COMMAND,
}));

const CONTROL_DEFS = [
  {
    // くりかえし：回数フィールド + 本体。
    type: "ctrl_repeat",
    message0: "くりかえし %1 かい",
    args0: [{ type: "field_number", name: "COUNT", value: 10, min: 0, precision: 1 }],
    message1: "%1",
    args1: [{ type: "input_statement", name: "BODY" }],
    previousStatement: null,
    nextStatement: null,
    colour: COLOUR_CONTROL,
  },
  {
    // 条件分岐：センサ + then / else（else は空なら toProgram で省く）。
    type: "ctrl_if",
    message0: "もし %1 なら",
    args0: [{ type: "field_dropdown", name: "COND", options: SENSOR_OPTIONS }],
    message1: "%1",
    args1: [{ type: "input_statement", name: "THEN" }],
    message2: "そうでなければ",
    message3: "%1",
    args3: [{ type: "input_statement", name: "ELSE" }],
    previousStatement: null,
    nextStatement: null,
    colour: COLOUR_CONTROL,
  },
  {
    // 条件くりかえし：センサが真の間、本体を繰り返す。
    type: "ctrl_while",
    message0: "%1 の間くりかえす",
    args0: [{ type: "field_dropdown", name: "COND", options: SENSOR_OPTIONS }],
    message1: "%1",
    args1: [{ type: "input_statement", name: "BODY" }],
    previousStatement: null,
    nextStatement: null,
    colour: COLOUR_CONTROL,
  },
];

// 二重登録（inject とテストの両方から呼ばれる等）を避けるためのフラグ。
let registered = false;

/** カスタムブロックを Blockly に登録する。inject / headless Workspace の前に呼ぶ（冪等）。 */
export function registerBlocks(): void {
  if (registered) return;
  Blockly.defineBlocksWithJsonArray([...COMMAND_DEFS, ...CONTROL_DEFS]);
  registered = true;
}

/** ブロックパレット（カテゴリ式）。 */
export const TOOLBOX = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "うごき",
      colour: String(COLOUR_COMMAND),
      contents: COMMAND_BLOCKS.map(({ type }) => ({ kind: "block", type })),
    },
    {
      kind: "category",
      name: "くりかえし・じょうけん",
      colour: String(COLOUR_CONTROL),
      contents: [
        { kind: "block", type: "ctrl_repeat" },
        { kind: "block", type: "ctrl_if" },
        { kind: "block", type: "ctrl_while" },
      ],
    },
  ],
};
