/**
 * 戦闘のチューニング値を 1 箇所に集約する。
 *
 * ゲームバランスの数値はここだけを編集すれば変えられる（調整しやすさを構造で担保する）。
 * ステージ単位の上書きに備え、関数へは BattleParams を引数（デフォルト付き）で渡せる構造にしてある。
 * TODO: 具体値は暫定。docs/game-rules/auto-battle.md に沿って調整する。
 */

export interface BattleParams {
  // 攻撃（ヒープ）が与える HP ダメージ。
  readonly attackDamage: number;
  // BP 上限＝この値に達すると過負荷でフリーズする。
  readonly bpMax: number;
  // 負荷攻撃（DDoS）が相手の BP を上げる量。
  readonly loadAttackBp: number;
  // 攻撃（重い処理）が自分の BP を上げる量＝ハイリスク・ハイリターン。
  readonly attackSelfBp: number;
  // 過負荷で発動するフリーズの継続クロック数（この間は wait に強制上書き）。
  readonly freezeClocks: number;
  // 毎クロックの BP 自然減（クールダウン）。
  readonly bpCooldownPerClock: number;
}

/** 既定のチューニング値。 */
export const BATTLE_PARAMS: BattleParams = {
  attackDamage: 1,
  bpMax: 10,
  loadAttackBp: 5,
  attackSelfBp: 2,
  freezeClocks: 3,
  bpCooldownPerClock: 1,
};
