/**
 * Chap1 共通の脆弱な敵（brittleAttack を無心に振り続ける脆弱型）。
 *
 * brittleAttack は命中時に自壊する暴発。
 * 敵は正面に相手が来た瞬間だけ自壊するので、攻撃を持たないカメ v1 でも勝てる＝Chap1 の勝ち筋。
 * チャプター内の各ステージで敵の構えは共通（配置だけステージごとに変える）のでここに一度だけ置く。
 */

import type { Program } from "$lib/domain";

/** 正面に立たれると自壊する脆弱な敵のプログラム（while(true){ brittleAttack }）。 */
export const BRITTLE_ENEMY_PROGRAM: Program = [
  { kind: "while", cond: { kind: "literal", value: true }, body: [{ kind: "call", cmd: "brittleAttack" }] },
];

/** 脆弱な敵の A面表示ラベル。 */
export const BRITTLE_ENEMY_LABEL = "バグったオートマトン";
