import { describe, it, expect } from "vitest";
import { interpret } from "./interpreter";
import type { Automaton, BattleState, Direction, Position } from "./model";
import type { Program, Step } from "#lib/domain/program";
import { nodeIdMap } from "#lib/domain/program";

// --- テスト用ヘルパー ---

function automaton(pos: Position, dir: Direction): Automaton {
  return { id: "ally", pos, dir, hp: 3, bp: 0, freezeRemaining: 0, priority: 1 };
}

function stateOf(ally: Automaton, enemy?: Automaton): BattleState {
  const automatons = enemy ? [ally, enemy] : [ally];
  return { grid: { width: 3, height: 1, walls: [] }, automatons, clock: 0, rngSeed: 0, logs: [], winner: null };
}

// プログラムを固定状態の下で最後まで引き出し、Step 列を得る。
// read は毎回同じ state を返す（制御フローの展開だけを見るため）。
function stepsOf(program: Program, state: BattleState): Step[] {
  const gen = interpret(program, "ally", () => state, nodeIdMap(program));
  const steps: Step[] = [];
  for (const step of gen) steps.push(step);
  return steps;
}

const base = stateOf(automaton({ x: 0, y: 0 }, "right"));

describe("interpret（逐次解釈）", () => {
  it("call は対応するアクションと nodeId を1つ yield する", () => {
    const program: Program = [{ kind: "call", cmd: "stepForward" }];
    expect(stepsOf(program, base)).toEqual([{ action: { kind: "move" }, nodeId: 0 }]);
  });

  it("repeat は body を count 回展開する", () => {
    const program: Program = [{ kind: "repeat", count: 3, body: [{ kind: "call", cmd: "attack" }] }];
    const steps = stepsOf(program, base);
    expect(steps).toHaveLength(3);
    expect(steps.every((s) => s.action.kind === "attack")).toBe(true);
  });

  it("if は条件の真偽で then / else を選ぶ", () => {
    const program: Program = [
      {
        kind: "if",
        cond: { kind: "literal", value: true },
        then: [{ kind: "call", cmd: "attack" }],
        else: [{ kind: "call", cmd: "wait" }],
      },
    ];
    expect(stepsOf(program, base).map((s) => s.action.kind)).toEqual(["attack"]);

    const elseTaken: Program = [
      {
        kind: "if",
        cond: { kind: "literal", value: false },
        then: [{ kind: "call", cmd: "attack" }],
        else: [{ kind: "call", cmd: "wait" }],
      },
    ];
    expect(stepsOf(elseTaken, base).map((s) => s.action.kind)).toEqual(["wait"]);
  });

  it("yield する nodeId は nodeIdMap の採番に一致する（repeat の子）", () => {
    // 0:repeat, 1:turnLeft。body の call は id=1。
    const program: Program = [{ kind: "repeat", count: 2, body: [{ kind: "call", cmd: "turnLeft" }] }];
    expect(stepsOf(program, base).map((s) => s.nodeId)).toEqual([1, 1]);
  });

  it("while は read() の最新状態を見てループし、条件が偽になると止まる", () => {
    // enemyAhead が真の間だけ attack。read が返す state を途中で差し替えて停止させる。
    const program: Program = [
      { kind: "while", cond: { kind: "sensor", sensor: "enemyAhead" }, body: [{ kind: "call", cmd: "attack" }] },
    ];
    const withEnemy = stateOf(automaton({ x: 0, y: 0 }, "right"), {
      id: "enemy",
      pos: { x: 1, y: 0 },
      dir: "left",
      hp: 3,
      bp: 0,
      freezeRemaining: 0,
      priority: 0,
    });
    const withoutEnemy = base;

    let state = withEnemy;
    const gen = interpret(program, "ally", () => state, nodeIdMap(program));
    const first = gen.next();
    expect(first.value?.action.kind).toBe("attack"); // enemy がいる間は回る
    state = withoutEnemy; // 敵が消えた＝次の条件評価で偽
    expect(gen.next().done).toBe(true);
  });

  it("空プログラムは即終了する", () => {
    expect(stepsOf([], base)).toEqual([]);
  });
});
