/**
 * program 概念の公開面（バレル）。命令木の言語モデルと、その上の操作（解析・コスト・指紋・整形）。
 * 他ディレクトリ・ドメイン公開 API はこのバレル経由で参照する（内部ファイル構成を隠す）。
 * 同階層のファイル同士は自バレルを介さず直接 `./xxx` を参照する（バレル自己循環の回避）。
 */

export type { NodeId, CommandName, SensorName, ControlName, Expr, Stmt, Program, Action, Step } from "./program";
export type { UsedCapabilities } from "./capabilities";
export { usedCapabilities } from "./capabilities";
export { programCost } from "./cost";
export { areProgramsEqual, hashProgram } from "./hash";
export type { FlatLine } from "./nodes";
export { nodeIdMap, flatLines } from "./nodes";
export type { ParseError, ParseResult } from "./parse";
export { programToText, parseProgram } from "./parse";
