/**
 * 戦闘のチューニング値を 1 箇所に集約する。
 *
 * ここは全ステージ共通の既定値。ステージ固有の調整は Stage.params（Partial 上書き）で宣言し、
 * resolveBattleParams で既定へ重ねて確定する＝全バランス knob がステージ側で成り立つ構造。
 * 関数（engine/runBattle）は確定済み BattleParams を引数で受ける（デフォルト付き）。
 * TODO: 具体値は暫定。docs/game-rules/auto-battle.md に沿って調整する。
 * TODO: 素質（baseImage）の戦闘効果＝単価上書き等は、
 *       ここを受け皿に、AutomatonImage の imageHash を入力して配線する。
 *       ステージ構成・数値バランスが固まるまで意図的に未配線。
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

/** 既定のチューニング値。ステージが上書きしなかった knob はこれが効く。 */
export const BATTLE_PARAMS: BattleParams = {
  attackDamage: 1,
  bpMax: 10,
  loadAttackBp: 5,
  attackSelfBp: 2,
  freezeClocks: 3,
  bpCooldownPerClock: 1,
};

/** 既定値にステージ上書きを重ねて確定 params を得る（上書きの合成規則はここが SSoT）。 */
export const resolveBattleParams = (override?: Partial<BattleParams>): BattleParams => ({
  ...BATTLE_PARAMS,
  ...override,
});
