/**
 * battle 概念の公開面（バレル）。盤面モデルと、対戦の実行（エンジン・パラメータ・1戦走行）。
 * 他ディレクトリ・ドメイン公開 API はこのバレル経由で参照する（内部ファイル構成を隠す）。
 * 同階層のファイル同士は自バレルを介さず直接 `./xxx` を参照する（バレル自己循環の回避）。
 */

// 盤面モデルの型は外部で使うものだけ公開（Position/Grid/WallEdge/DamageLog/BattleResult は battle 内専用）。
export type { Automaton, AutomatonId, BattleState, Direction, Winner } from "./battle";
export { withAllyInitialHp } from "./battle";
// engine の純関数は battle 内専用（commandToAction/exprValue/applyAction 等は同階層が直参照）。wallSide のみステージ定義が使う。
export { wallSide } from "./engine";
export type { BattleParams } from "./params";
export { resolveBattleParams } from "./params";
export type { BattleRun } from "./runBattle";
export { runBattle, recordBattle, recordRun } from "./runBattle";
