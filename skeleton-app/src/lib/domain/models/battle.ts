/**
 * バトルポッドの盤面モデル（PoC）。
 *
 * ドメイン層は純 TypeScript・決定的・不変。
 * Svelte / DOM / 外部データを持ち込まない。
 * 設計の最新断面は docs/design/execution-model.md を正とする。
 */

import type { NodeId } from "./program";

export type Direction = "up" | "down" | "left" | "right";

export interface Position {
  readonly x: number;
  readonly y: number;
}

// オートマトン＝プログラムで自律行動するエンティティ（この世界の種族名）。壁/アイテムを含む総称「エンティティ」の一種。
/** オートマトンの陣営 ID。Ally＝プレイヤー、Enemy＝敵。PoC ではこの 2 体のみ。 */
export type AutomatonId = "ally" | "enemy";

export interface Automaton {
  readonly id: AutomatonId;
  readonly pos: Position;
  readonly dir: Direction;
  readonly hp: number;
  // BP（ビジーポイント＝CPU 負荷）。HP と逆に溜まり、上限で過負荷フリーズする。
  readonly bp: number;
  // フリーズ残りクロック数。> 0 の間はコマンドが wait に強制上書きされる。0 で通常行動。
  readonly freezeRemaining: number;
  // スケジューリング優先度。同クロックでは高い方が先に行動する（ally を高くしてプレイヤー先手）。
  readonly priority: number;
}

/** 格子状のバトルポッド。壁マスは PoC では少数前提で配列で保持する。 */
export interface Grid {
  readonly width: number;
  readonly height: number;
  readonly walls: readonly Position[];
}

export type Winner = AutomatonId | "draw";

/** 攻撃が命中してダメージが入ったことの記録（観戦・検証用）。 */
export interface DamageLog {
  readonly clock: number;
  readonly attacker: AutomatonId;
  readonly target: AutomatonId;
  readonly damage: number;
  readonly targetHpAfter: number;
}

/** 対戦の瞬間の状態。不変。applyAction が新しい状態を返す。 */
export interface BattleState {
  readonly grid: Grid;
  readonly automatons: readonly Automaton[];
  readonly clock: number;
  // 乱数の種。決定性を保つため導入しておらず、拡張用に予約している。
  readonly rngSeed: number;
  readonly logs: readonly DamageLog[];
  readonly winner: Winner | null;
  // このフレームに至るクロックで各オートマトンが実行した命令ノード（実行ハイライト用の観測記録）。
  // logs と同じく観戦・検証のための記録。初期フレームには無い。
  readonly active?: Partial<Record<AutomatonId, NodeId>>;
}

/**
 * ally の初期 HP を差し替えた盤面を返す（他の自動機・盤面は不変で温存）。
 * ally の HP はステージ固有値ではなく、デプロイ時にプレイヤーがメモリ総量から配分する個体値。
 * 差し替え元（ステージ初期盤面）はプレビューと対戦の双方が共有するため、この純変換に一本化する。
 */
export const withAllyInitialHp = (state: BattleState, hp: number): BattleState => ({
  ...state,
  automatons: state.automatons.map((a) => (a.id === "ally" ? { ...a, hp } : a)),
});

/** 対戦の結果。 */
export interface BattleResult {
  readonly winner: Winner;
  readonly clocks: number;
  readonly finalState: BattleState;
}
