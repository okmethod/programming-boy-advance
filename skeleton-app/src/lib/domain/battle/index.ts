/**
 * battle ドメインの公開 API。
 * 他ディレクトリ・ドメイン公開 API はこのバレル経由で参照する。
 * 同階層のファイル同士は、バレルを介さず直接参照する（バレル自己循環の回避）。
 */

export type { Automaton, AutomatonId, BattleState, Direction, Winner } from "./model";
export { withAllyInitialHp } from "./model";

export { wallOn } from "./grid";

export type { BattleParams } from "./params";
export { resolveBattleParams } from "./params";

export type { BattleRun } from "./loop";
export { runBattle, recordBattle, recordRun } from "./loop";
