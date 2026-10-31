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

// 配色（Blockly の HSV 色相）。コマンド=緑系 / クエリ=青系 / 制御=橙系。
const COLOUR_COMMAND = 160;
const COLOUR_QUERY = 210;
const COLOUR_CONTROL = 30;

// クエリ（センサ）。値（Boolean）を返す式ブロックで、if/while の条件スロットに差し込む。
// { type, label }：label は A面（プレイヤー向け）、type の接尾辞が B面の SensorName。
const QUERY_BLOCKS: { type: string; label: string }[] = [
  { type: "qry_enemyAhead", label: "敵が近い?" },
  { type: "qry_wallAhead", label: "壁がある?" },
];

// block.type からセンサ名を取り出す接頭辞（toProgram でも使う）。
export const QUERY_PREFIX = "qry_";

// 条件スロットの初期表示＝「クエリを差し込む穴」を示すプレースホルダ shadow。
// 具体的なクエリ（敵が近い?）を既定にすると「選択済み」に見えるため、空の目印にする。
// qry_ 接頭辞を持たないので toProgram では未選択として扱われる（condToExpr のフォールバック）。
export const COND_PLACEHOLDER_TYPE = "cond_placeholder";

const QUERY_DEFS = [
  ...QUERY_BLOCKS.map(({ type, label }) => ({
    type,
    message0: label,
    output: "Boolean",
    colour: COLOUR_QUERY,
  })),
  {
    // プレースホルダ：灰色・淡色で「ここにクエリを入れる」ことだけを示す。
    type: COND_PLACEHOLDER_TYPE,
    message0: "＜クエリ＞",
    output: "Boolean",
    colour: "#94a3b8",
  },
];

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
    // 条件分岐（if のみ）：条件が真なら then を実行。else は持たない。
    type: "ctrl_if",
    message0: "もし %1 なら",
    args0: [{ type: "input_value", name: "COND", check: "Boolean" }],
    message1: "%1",
    args1: [{ type: "input_statement", name: "THEN" }],
    previousStatement: null,
    nextStatement: null,
    colour: COLOUR_CONTROL,
  },
  {
    // 条件分岐（if / else）：then と else（else は空なら toProgram で省く）。
    type: "ctrl_if_else",
    message0: "もし %1 なら",
    args0: [{ type: "input_value", name: "COND", check: "Boolean" }],
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
    // 条件くりかえし：条件（クエリ値ブロック）が真の間、本体を繰り返す。
    type: "ctrl_while",
    message0: "%1 の間くりかえす",
    args0: [{ type: "input_value", name: "COND", check: "Boolean" }],
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
  Blockly.defineBlocksWithJsonArray([...COMMAND_DEFS, ...QUERY_DEFS, ...CONTROL_DEFS]);
  registered = true;
}

// flyout.show() に渡すブロック項目（条件スロットの shadow を任意で持てる）。
interface FlyoutBlock {
  readonly kind: "block";
  readonly type: string;
  readonly inputs?: Record<string, { shadow: { type: string } }>;
}

const toFlyoutBlocks = (types: string[]): FlyoutBlock[] => types.map((type) => ({ kind: "block", type }));

// if/while は条件スロットに「＜クエリ＞」プレースホルダ shadow を載せて出す
// （クエリを差し込む穴だと一目で分かるように。具体クエリだと選択済みに見えるため）。
const withCondShadow = (type: string): FlyoutBlock => ({
  kind: "block",
  type,
  inputs: { COND: { shadow: { type: COND_PLACEHOLDER_TYPE } } },
});

/** パレットのカテゴリ。上部タブで1つ選び、その中身だけを固定幅フライアウトに表示する。 */
export interface BlockCategory {
  readonly id: string;
  readonly label: string;
  // flyout.show() にそのまま渡せるブロック並び。
  readonly contents: FlyoutBlock[];
}

/**
 * ブロックパレットのカテゴリ定義（コマンド / クエリ / 制御の3ファミリー＝CQS）。
 *
 * カテゴリ式ツールボックス（クリックでポップアップ）は開閉で横幅が変わり盤面と重なるため使わない。
 * 代わりに上部タブで選んだ1カテゴリのみを常時表示の固定幅フライアウトに出す（横幅は不変）。
 */
export const BLOCK_CATEGORIES: BlockCategory[] = [
  { id: "command", label: "コマンド", contents: toFlyoutBlocks(COMMAND_BLOCKS.map(({ type }) => type)) },
  { id: "query", label: "クエリ", contents: toFlyoutBlocks(QUERY_BLOCKS.map(({ type }) => type)) },
  {
    id: "control",
    label: "制御",
    contents: [
      toFlyoutBlocks(["ctrl_repeat"])[0],
      withCondShadow("ctrl_if"),
      withCondShadow("ctrl_if_else"),
      withCondShadow("ctrl_while"),
    ],
  },
];

/** inject 用の初期ツールボックス（最初のカテゴリを出す固定幅フライアウト）。 */
export const TOOLBOX = {
  kind: "flyoutToolbox",
  contents: BLOCK_CATEGORIES[0].contents,
};
