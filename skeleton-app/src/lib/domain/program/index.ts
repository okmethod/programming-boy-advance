/**
 * program ドメインの公開 API。
 * 他ディレクトリ・ドメイン公開 API はこのバレル経由で参照する。
 * 同階層のファイル同士は、バレルを介さず直接参照する（バレル自己循環の回避）。
 */

export type { NodeId, CommandName, SensorName, ControlName, Expr, Stmt, Program, Action, Step } from "./model";

export { programCost, usedCapabilities, areProgramsEqual } from "./derive";

export type { FlatLine } from "./linearize";
export { nodeIdMap, flatLines } from "./linearize";

export type { ParseError, ParseResult } from "./parse";
export { programToText, parseProgram } from "./parse";
