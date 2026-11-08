/**
 * お手本プリセット＝レジストリの初期シード（読み取り専用）。
 *
 * ブロックで組む前に挙動を確かめるための見本プログラム。コード所有＝永続化せず毎回ここから再シードする。
 * レジストリ usecase が初期状態を組み立てるのに使うのでアプリ層に置く（将来 catalog 化したら
 * Port 経由でインフラ層に移す）。
 */

import type { BaseImage, Program } from "$lib/domain";
import { TURTLOGO_V2 } from "$lib/domain";

/** お手本プリセット：ブロックで組む前に挙動を確かめるための見本。 */
export interface AllyPreset {
  readonly label: string;
  readonly program: Program;
  // この見本がビルドされた素質（系統×版）。プログラムが使う命令を賄える版を各プリセットが自己記述する。
  readonly baseImage: BaseImage;
}

/** 選ぶと Blockly に復元され、そこから allyProgram が再生成される見本一覧。
 *  ループは「ずっとくりかえす」（while(true) の糖衣）で表す。対戦は共通クロックの上限で止まる。
 *  見本はいずれもクエリ・制御（if/while/sensor）を使うため、素質はフル機能の v2.0 を土台とする。 */
export const ALLY_PRESETS: Record<string, AllyPreset> = {
  forward: {
    label: "前進する",
    program: [{ kind: "while", cond: { kind: "literal", value: true }, body: [{ kind: "call", cmd: "stepForward" }] }],
    baseImage: TURTLOGO_V2,
  },
  forwardAttack: {
    label: "前進し、攻撃する",
    baseImage: TURTLOGO_V2,
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
