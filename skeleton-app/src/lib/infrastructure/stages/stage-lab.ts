/**
 * ステージ設計の試走表：盤面に候補プログラムを一通り走らせ、勝敗・CP・クロック数・軌跡を並べる。
 *
 * 設計中の盤面（ASCII 図の下書き）や登録済みステージで「想定解が勝つ／弾きたい解が負ける」を一目で確かめるための道具。
 * 判定（assert）はしない。設計が固まったら、意図は各チャプターのテストに stage-test-kit の部品で書く。
 * アプリ本体からは参照しない（設計・テスト専用）。実行の入口は stage-lab.run.test.ts。
 */

import { programCost, runBattle, withAllyInitialHp } from "#lib/domain";
import type { Program, Winner } from "#lib/domain";
import type { Stage } from "#lib/application";
import { BRITTLE_ENEMY_PROGRAM } from "./chapter1/brittle-enemy";
import { formatStageMap } from "./stage-map";
import type { StageMap } from "./stage-map";
import {
  AHEAD_FIRST,
  LEFT_WALL_FOLLOWER_SIMPLE,
  NAIVE_V3,
  RIGHT_ONLY,
  WALL_FOLLOWER,
  WALL_FOLLOWER_SIMPLE,
  stageMapOf,
} from "./stage-test-kit";

type LabStage = Pick<Stage, "initial" | "enemy">;

/** 試走表の1行＝1候補プログラムの結果。 */
export interface LabRow {
  readonly name: string;
  readonly winner: Winner;
  readonly cost: number;
  readonly clocks: number;
  // ally が通ったマス（"x,y"）。同じマスに留まったクロックはまとめる。
  readonly trail: readonly string[];
}

/** 既定の候補＝stage-test-kit の定型の解法候補（チャプター2の壁沿い系）。テーマが変われば呼び出し側で差し替える。 */
export const DEFAULT_LAB_CANDIDATES: Readonly<Record<string, Program>> = {
  WALL_FOLLOWER,
  WALL_FOLLOWER_SIMPLE,
  LEFT_WALL_FOLLOWER_SIMPLE,
  RIGHT_ONLY,
  NAIVE_V3,
  AHEAD_FIRST,
};

/** ASCII 図の下書きから、試走できるステージ（脆弱敵・既定の初期値）を組み立てる。 */
export function labStageFromMap(map: StageMap): LabStage {
  return {
    enemy: BRITTLE_ENEMY_PROGRAM,
    initial: {
      grid: map.grid,
      automatons: [
        { id: "ally", ...map.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
        { id: "enemy", ...map.enemy, hp: 1, bp: 0, freezeRemaining: 0, priority: 0 },
      ],
      clock: 0,
      rngSeed: 0,
      logs: [],
      winner: null,
    },
  };
}

/** 各候補を走らせた結果を返す。軌跡は対戦の観戦フレーム列から取る（1候補につき対戦1回）。 */
export function runStageLab(
  stage: LabStage,
  candidates: Readonly<Record<string, Program>> = DEFAULT_LAB_CANDIDATES,
): LabRow[] {
  const state = withAllyInitialHp(stage.initial, 3);
  return Object.entries(candidates).map(([name, program]) => {
    const { frames, result } = runBattle(state, program, stage.enemy);
    const trail: string[] = [];
    for (const frame of frames) {
      const ally = frame.automatons.find((a) => a.id === "ally");
      if (!ally) continue;
      const cell = `${ally.pos.x},${ally.pos.y}`;
      if (trail[trail.length - 1] !== cell) trail.push(cell);
    }
    return { name, winner: result.winner, cost: programCost(program), clocks: result.clocks, trail };
  });
}

/** 盤面の図・概要・試走表を、ターミナルで読む文字列にする。 */
export function formatStageLab(stage: LabStage, rows: readonly LabRow[], maxTrail = 40): string {
  const map = stageMapOf(stage);
  const { width, height, walls } = map.grid;
  const cells = width * height;
  const openEdges = (width - 1) * height + width * (height - 1) - walls.length;
  // 通れる辺＝セル数−1 ならループの無い迷路（木）。迷路以外の盤面では参考値。
  const summary = `cells=${cells} walls=${walls.length} openEdges=${openEdges} (ループの無い迷路なら ${cells - 1})`;
  const nameWidth = Math.max(...rows.map((row) => row.name.length));
  const lines = rows.map((row) => {
    const trail = row.trail.length > maxTrail ? [...row.trail.slice(0, maxTrail), "…"] : row.trail;
    const winner = row.winner === "ally" ? "WIN " : row.winner.padEnd(4);
    return `${winner} cp=${row.cost} clk=${String(row.clocks).padStart(4)} ${row.name.padEnd(nameWidth)}  ${trail.join(" ")}`;
  });
  return [formatStageMap(map), summary, ...lines].join("\n");
}
