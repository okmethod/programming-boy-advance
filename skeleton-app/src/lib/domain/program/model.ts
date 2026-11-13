/**
 * 命令木（プログラム）の言語モデル。
 *
 * ブロックUI はこの命令木を出力する想定。JS 文字列ではない。
 * 文（Stmt）と式（Expr）の二層構造。CQS に沿い、コマンドは状態を変え、クエリ（式）は値を返す。
 * 盤面モデルには依存しない（この層は「何を命じるか」だけを表す）。
 */

/** 命令木のノード識別子（プログラム表示の実行ハイライト用）。構造上の pre-order 連番。 */
export type NodeId = number;

export type CommandName = "stepForward" | "turnRight" | "turnLeft" | "attack" | "loadAttack" | "brittleAttack" | "wait";

export type SensorName = "wallAhead" | "enemyAhead";

export type ControlName = "if" | "repeat" | "while";

export type Expr =
  { readonly kind: "sensor"; readonly sensor: SensorName } | { readonly kind: "literal"; readonly value: boolean };

export type Stmt =
  | { readonly kind: "call"; readonly cmd: CommandName }
  | { readonly kind: "if"; readonly cond: Expr; readonly then: readonly Stmt[]; readonly else?: readonly Stmt[] }
  | { readonly kind: "repeat"; readonly count: number; readonly body: readonly Stmt[] }
  | { readonly kind: "while"; readonly cond: Expr; readonly body: readonly Stmt[] };

export type Program = readonly Stmt[];

/** インタプリタが1クロックに1つ yield する最小の効果単位。 */
export type Action =
  | { readonly kind: "move" }
  | { readonly kind: "turn"; readonly rotation: "left" | "right" }
  | { readonly kind: "attack" }
  | { readonly kind: "loadAttack" }
  | { readonly kind: "brittleAttack" }
  | { readonly kind: "wait" };

/** インタプリタが1クロックに1つ yield する単位。アクションと、それを生んだ命令ノードの id。 */
export interface Step {
  readonly action: Action;
  readonly nodeId: NodeId;
}
