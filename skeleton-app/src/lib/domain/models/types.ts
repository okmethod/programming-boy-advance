/**
 * バトルポッドの中核モデル（PoC）。
 *
 * ドメイン層は純 TypeScript・決定的・不変。
 * Svelte / DOM / 外部データを持ち込まない。
 * 設計の最新断面は docs/design/execution-model.md を正とする。
 */

export type Direction = "up" | "down" | "left" | "right";

export interface Position {
  readonly x: number;
  readonly y: number;
}

// オートマトン＝プログラムで自律行動するエンティティ（この世界の種族名）。
// 壁/アイテムも含む総称「エンティティ」のうち、現状のモデルは自キャラ・敵キャラの2体のみを扱う。
// 陣営の区別：自キャラ=Ally（プレイヤーのオートマトン）、敵キャラ=Enemy。
/** オートマトンの陣営 ID。PoC では自キャラ（Ally）と敵キャラ（Enemy）の2体のみ。 */
export type AutomatonId = "ally" | "enemy";

export interface Automaton {
  readonly id: AutomatonId;
  readonly pos: Position;
  readonly dir: Direction;
  readonly hp: number;
  // スケジューリング優先度。同クロックでは高い方が先に行動する。
  // PoC では固定値（ally を高くしてプレイヤー先手）。
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
  // 将来の乱数用。PoC では未使用（決定性維持のため乱数を導入していない）。
  readonly rngSeed: number;
  readonly logs: readonly DamageLog[];
  readonly winner: Winner | null;
}

// --- プログラム（命令木） ---
// ブロックUI はこの命令木を出力する想定。JS 文字列ではない。

export type CommandName = "stepForward" | "turnRight" | "turnLeft" | "attack" | "wait";

export type SensorName = "wallAhead" | "enemyAhead";

export type Stmt =
  | { readonly kind: "call"; readonly cmd: CommandName }
  | { readonly kind: "repeat"; readonly count: number; readonly body: readonly Stmt[] }
  | { readonly kind: "if"; readonly cond: SensorName; readonly then: readonly Stmt[]; readonly else?: readonly Stmt[] }
  | { readonly kind: "while"; readonly cond: SensorName; readonly body: readonly Stmt[] };

export type Program = readonly Stmt[];

// --- アクション（インタプリタが1クロックに1つ yield する最小の効果単位） ---

export type Action =
  | { readonly kind: "move" }
  | { readonly kind: "turn"; readonly rotation: "left" | "right" }
  | { readonly kind: "attack" }
  | { readonly kind: "wait" };

/** 対戦の結果。 */
export interface BattleResult {
  readonly winner: Winner;
  readonly clocks: number;
  readonly finalState: BattleState;
}
