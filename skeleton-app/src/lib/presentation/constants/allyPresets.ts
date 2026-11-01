/**
 * お手本プリセットとオートマトンの既定 CP 容量。
 *
 * レジストリ一覧に並べる「お手本」の見本プログラムと、ステージ非依存の CP 上限を提供する。
 * 構築ドロワー（プレイ面）とレジストリ管理ページで共有する。
 */

import type { Program } from "$lib/domain";

/** お手本プリセット：ブロックで組む前に挙動を確かめるための見本。 */
export interface AllyPreset {
  readonly label: string;
  readonly program: Program;
}

/** 選ぶと Blockly に復元され、そこから allyProgram が再生成される見本一覧。
 *  ループは「ずっとくりかえす」（while(true) の糖衣）で表す。対戦は共通クロックの上限で止まる。 */
export const ALLY_PRESETS: Record<string, AllyPreset> = {
  forward: {
    label: "前進する",
    program: [{ kind: "while", cond: { kind: "literal", value: true }, body: [{ kind: "call", cmd: "stepForward" }] }],
  },
  forwardAttack: {
    label: "前進し、攻撃する",
    program: [
      {
        kind: "while",
        cond: { kind: "literal", value: true },
        body: [
          {
            kind: "if",
            cond: { kind: "sensor", sensor: "enemyAhead" },
            then: [{ kind: "call", cmd: "attack" }],
            else: [{ kind: "call", cmd: "stepForward" }],
          },
        ],
      },
    ],
  },
};

// CP（作成予算）の上限はステージではなくオートマトンに属する概念。
// ステージ非依存で構築するレジストリ管理ページでは、この既定値を上限に使う。
// TODO: 将来はオートマトンイメージ単位の capacity フィールドに置き換える。
export const DEFAULT_AUTOMATON_CAPACITY = 25;
