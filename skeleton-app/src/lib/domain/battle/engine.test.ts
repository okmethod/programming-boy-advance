import { describe, it, expect } from "vitest";
import { applyAction, advanceClock, commandToAction } from "./engine";
import { wallOn } from "./grid";
import type { Automaton, BattleState, Direction, Position } from "./model";
import type { BattleParams } from "./params";

// --- テスト用ヘルパー ---

function automaton(id: Automaton["id"], pos: Position, dir: Direction, hp = 3): Automaton {
  return { id, pos, dir, hp, bp: 0, freezeRemaining: 0, priority: id === "ally" ? 1 : 0 };
}

function state(automatons: readonly Automaton[], walls: BattleState["grid"]["walls"] = []): BattleState {
  return { grid: { width: 3, height: 1, walls }, automatons, clock: 0, rngSeed: 0, logs: [], winner: null };
}

const find = (s: BattleState, id: Automaton["id"]): Automaton => s.automatons.find((e) => e.id === id)!;

describe("commandToAction（コマンド→アクション変換）", () => {
  it("各コマンドを対応するアクションに写す", () => {
    expect(commandToAction("stepForward")).toEqual({ kind: "move" });
    expect(commandToAction("turnRight")).toEqual({ kind: "turn", rotation: "right" });
    expect(commandToAction("turnLeft")).toEqual({ kind: "turn", rotation: "left" });
    expect(commandToAction("attack")).toEqual({ kind: "attack" });
    expect(commandToAction("loadAttack")).toEqual({ kind: "loadAttack" });
    expect(commandToAction("brittleAttack")).toEqual({ kind: "brittleAttack" });
    expect(commandToAction("wait")).toEqual({ kind: "wait" });
  });
});

describe("applyAction（move）", () => {
  it("空いた前方へ前進する", () => {
    const next = applyAction(state([automaton("ally", { x: 0, y: 0 }, "right")]), "ally", { kind: "move" });
    expect(find(next, "ally").pos).toEqual({ x: 1, y: 0 });
  });

  it("前方の辺に壁があると前進できない（その場に留まる）", () => {
    const walls = [wallOn({ x: 0, y: 0 }, "right")];
    const next = applyAction(state([automaton("ally", { x: 0, y: 0 }, "right")], walls), "ally", { kind: "move" });
    expect(find(next, "ally").pos).toEqual({ x: 0, y: 0 });
  });

  it("他オートマトンのいるマスへは進めない", () => {
    const s = state([automaton("ally", { x: 0, y: 0 }, "right"), automaton("enemy", { x: 1, y: 0 }, "left")]);
    const next = applyAction(s, "ally", { kind: "move" });
    expect(find(next, "ally").pos).toEqual({ x: 0, y: 0 });
  });
});

describe("applyAction（turn）", () => {
  it("向きを旋回する", () => {
    const next = applyAction(state([automaton("ally", { x: 0, y: 0 }, "right")]), "ally", {
      kind: "turn",
      rotation: "right",
    });
    expect(find(next, "ally").dir).toBe("down");
  });
});

describe("applyAction（attack）", () => {
  // ally(x0,右) と enemy(x1,左) が隣接する盤面。
  const facing = (enemyHp = 2) =>
    state([automaton("ally", { x: 0, y: 0 }, "right"), automaton("enemy", { x: 1, y: 0 }, "left", enemyHp)]);

  it("前方の相手に命中＝相手 HP を削り、攻撃側の BP が上がる", () => {
    const next = applyAction(facing(), "ally", { kind: "attack" });
    expect(find(next, "enemy").hp).toBe(1); // 既定 attackDamage=1
    expect(find(next, "ally").bp).toBeGreaterThan(0); // 攻撃側に負荷
    expect(next.logs).toHaveLength(1);
  });

  it("撃破すると winner が決まる", () => {
    const next = applyAction(facing(1), "ally", { kind: "attack" });
    expect(find(next, "enemy").hp).toBeLessThanOrEqual(0);
    expect(next.winner).toBe("ally");
  });

  it("空振り（前方に相手なし）は状態を変えない（同一参照）", () => {
    const s = state([automaton("ally", { x: 0, y: 0 }, "right")]);
    expect(applyAction(s, "ally", { kind: "attack" })).toBe(s);
  });
});

describe("applyAction（loadAttack：負荷攻撃）", () => {
  // 負荷攻撃1発で上限到達＝即フリーズする検証用の params。
  const params: BattleParams = {
    attackDamage: 1,
    bpMax: 10,
    loadAttackBp: 10,
    attackSelfBp: 2,
    freezeClocks: 2,
    bpCooldownPerClock: 1,
  };
  const facing = () => state([automaton("ally", { x: 0, y: 0 }, "right"), automaton("enemy", { x: 1, y: 0 }, "left")]);

  it("相手の BP を上げ、上限到達で過負荷フリーズさせる（HP は削らない）", () => {
    const next = applyAction(facing(), "ally", { kind: "loadAttack" }, params);
    const enemy = find(next, "enemy");
    expect(enemy.hp).toBe(3);
    expect(enemy.freezeRemaining).toBe(params.freezeClocks);
    expect(enemy.bp).toBe(0); // フリーズ発動で放電
  });
});

describe("applyAction（brittleAttack：暴発のみ）", () => {
  const facing = () =>
    state([automaton("ally", { x: 0, y: 0 }, "right"), automaton("enemy", { x: 1, y: 0 }, "left", 2)]);

  it("前方に相手がいると自分が自壊し、相手は無傷＝勝者は相手", () => {
    const next = applyAction(facing(), "ally", { kind: "brittleAttack" });
    expect(find(next, "ally").hp).toBe(0);
    expect(find(next, "enemy").hp).toBe(2);
    expect(next.winner).toBe("enemy");
  });

  it("空振り（前方に相手なし）は無害＝同一参照を返す", () => {
    const s = state([automaton("ally", { x: 0, y: 0 }, "right")]);
    expect(applyAction(s, "ally", { kind: "brittleAttack" })).toBe(s);
  });
});

describe("applyAction（ガード）", () => {
  it("フリーズ中はコマンドが無効＝状態を変えない", () => {
    const frozen: Automaton = { ...automaton("ally", { x: 0, y: 0 }, "right"), freezeRemaining: 2 };
    const s = state([frozen]);
    expect(applyAction(s, "ally", { kind: "move" })).toBe(s);
  });

  it("決着後は進めない＝状態を変えない", () => {
    const s: BattleState = { ...state([automaton("ally", { x: 0, y: 0 }, "right")]), winner: "ally" };
    expect(applyAction(s, "ally", { kind: "move" })).toBe(s);
  });

  it("wait は何も起こさない（同一参照）", () => {
    const s = state([automaton("ally", { x: 0, y: 0 }, "right")]);
    expect(applyAction(s, "ally", { kind: "wait" })).toBe(s);
  });
});

describe("advanceClock（時間経過）", () => {
  it("クロックを1進め、HP は変えない", () => {
    const s = state([automaton("ally", { x: 0, y: 0 }, "right", 3)]);
    const next = advanceClock(s);
    expect(next.clock).toBe(1);
    expect(find(next, "ally").hp).toBe(3);
  });

  it("フリーズ残クロックを1減らす（0 で通常行動に戻る）", () => {
    const frozen: Automaton = { ...automaton("ally", { x: 0, y: 0 }, "right"), freezeRemaining: 1 };
    const next = advanceClock(state([frozen]));
    expect(find(next, "ally").freezeRemaining).toBe(0);
  });

  it("フリーズしていない体は BP が自然減（クールダウン）する", () => {
    const busy: Automaton = { ...automaton("ally", { x: 0, y: 0 }, "right"), bp: 5 };
    const params: BattleParams = {
      attackDamage: 1,
      bpMax: 10,
      loadAttackBp: 10,
      attackSelfBp: 2,
      freezeClocks: 2,
      bpCooldownPerClock: 2,
    };
    expect(find(advanceClock(state([busy]), params), "ally").bp).toBe(3);
  });

  it("フリーズ中の体は BP クールダウンせず、フリーズ解除を優先する", () => {
    const frozenBusy: Automaton = { ...automaton("ally", { x: 0, y: 0 }, "right"), bp: 5, freezeRemaining: 2 };
    const next = find(advanceClock(state([frozenBusy])), "ally");
    expect(next.freezeRemaining).toBe(1);
    expect(next.bp).toBe(5); // フリーズ中はクールダウンしない
  });
});
