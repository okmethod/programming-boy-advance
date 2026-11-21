/**
 * ステージのテスト・設計検証で共通に使う補助関数と定型の解法候補。
 *
 * ステージの設計意図（想定解が勝つ・CP 上限に収まる／弾きたい解が勝たない）を、
 * 各チャプターのテストが同じ部品で assert できるようにする。アプリ本体からは参照しない（テスト専用）。
 */

import { runBattle, withAllyInitialHp } from "#lib/domain";
import type { Program } from "#lib/domain";
import type { Stage } from "#lib/application";
import type { StageMap } from "./stage-map";

export const fwd = { kind: "call", cmd: "stepForward" } as const;
export const right = { kind: "call", cmd: "turnRight" } as const;
export const left = { kind: "call", cmd: "turnLeft" } as const;

/** ステージの CP 上限＝配分で HP に1目盛り残すため memoryTotal−memoryGrain（CapacityAllocator の可動域）。 */
export function cpMax(stage: Pick<Stage, "memoryTotal" | "memoryGrain">): number {
  return stage.memoryTotal - stage.memoryGrain;
}

/** 攻撃を使わず、プログラムを走らせた勝者を返す（脆弱敵の正面に立てば ally 勝ち）。 */
export function winsWith(stage: Pick<Stage, "initial" | "enemy">, program: Program) {
  const state = withAllyInitialHp(stage.initial, 3);
  return runBattle(state, program, stage.enemy).result.winner;
}

/** ステージの初期盤面を、ASCII 図と相互変換できる形（StageMap）で取り出す。 */
export function stageMapOf(stage: Pick<Stage, "initial">): StageMap {
  const find = (id: "ally" | "enemy") => {
    const automaton = stage.initial.automatons.find((a) => a.id === id);
    if (!automaton) throw new Error(`Stage has no ${id}`);
    return { pos: automaton.pos, dir: automaton.dir };
  };
  return { grid: stage.initial.grid, ally: find("ally"), enemy: find("enemy") };
}

const forever = (body: Program): Program => [{ kind: "while", cond: { kind: "literal", value: true }, body }];
const wallAhead = { kind: "sensor", sensor: "wallAhead" } as const;
const wallRight = { kind: "sensor", sensor: "wallRight" } as const;
const wallLeft = { kind: "sensor", sensor: "wallLeft" } as const;
const openRight = { kind: "not", operand: wallRight } as const;
const openAhead = { kind: "not", operand: wallAhead } as const;

/** v3: 進んで、前が壁なら右折。前方だけを見る素朴解（右の開きは読めない）。 */
export const NAIVE_V3: Program = forever([fwd, { kind: "if", cond: wallAhead, then: [right] }]);

/** v4: 右が開けば右折、そうでなければ直進＝右手法の縮約形（左折なし・CP 4）。 */
export const RIGHT_ONLY: Program = forever([{ kind: "if", cond: openRight, then: [right] }, fwd]);

/** v4: 右手法の簡略形＝RIGHT_ONLY に「前が壁なら左折」を1つ並べた形（CP 6）。 */
export const WALL_FOLLOWER_SIMPLE: Program = forever([
  { kind: "if", cond: openRight, then: [right] },
  { kind: "if", cond: wallAhead, then: [left] },
  fwd,
]);

/** v4: 左手法の簡略形＝WALL_FOLLOWER_SIMPLE の左右を入れ替えた形（左が開けば左折、前が壁なら右折・CP 6）。 */
export const LEFT_WALL_FOLLOWER_SIMPLE: Program = forever([
  { kind: "if", cond: { kind: "not", operand: wallLeft }, then: [left] },
  { kind: "if", cond: wallAhead, then: [right] },
  fwd,
]);

/** v4: 右手法のフル形＝右が開けば右折して進む、前が開けば進む、どちらも壁なら左折（CP 7）。 */
export const WALL_FOLLOWER: Program = forever([
  {
    kind: "if",
    cond: openRight,
    then: [right, fwd],
    else: [{ kind: "if", cond: openAhead, then: [fwd], else: [left] }],
  },
]);

/** v4: 前が壁になってから、右が壁かどうかで左右を選ぶ解（右を先に見ないので角の正面ダミーへ入る）。 */
export const AHEAD_FIRST: Program = forever([
  { kind: "if", cond: wallAhead, then: [{ kind: "if", cond: wallRight, then: [left], else: [right] }] },
  fwd,
]);
