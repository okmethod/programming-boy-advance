/**
 * バトルポッドの純粋ロジック：グリッド計算・センサ評価・コマンド変換・1アクションの状態遷移。
 *
 * すべて決定的な純関数。乱数・時刻・DOM に依存しない。
 */

import type { Automaton, AutomatonId, BattleState, Direction, Grid, Position, Winner } from "$lib/domain/models/battle";
import type { Action, CommandName, Expr, SensorName } from "$lib/domain/models/program";
import { BATTLE_PARAMS, type BattleParams } from "./params";

const DIR_VECTORS: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const RIGHT_OF: Record<Direction, Direction> = { up: "right", right: "down", down: "left", left: "up" };
const LEFT_OF: Record<Direction, Direction> = { up: "left", left: "down", down: "right", right: "up" };

function rotate(dir: Direction, rotation: "left" | "right"): Direction {
  return rotation === "right" ? RIGHT_OF[dir] : LEFT_OF[dir];
}

function add(a: Position, b: Position): Position {
  return { x: a.x + b.x, y: a.y + b.y };
}

function frontCell(pos: Position, dir: Direction): Position {
  return add(pos, DIR_VECTORS[dir]);
}

function inBounds(grid: Grid, p: Position): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < grid.width && p.y < grid.height;
}

// 場外は壁と同じく「進めない」扱いにする。
function isWall(grid: Grid, p: Position): boolean {
  return !inBounds(grid, p) || grid.walls.some((w) => w.x === p.x && w.y === p.y);
}

function samePos(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

/** コマンド名を、状態非依存のアクションに変換する。 */
export function commandToAction(cmd: CommandName): Action {
  switch (cmd) {
    case "stepForward":
      return { kind: "move" };
    case "turnRight":
      return { kind: "turn", rotation: "right" };
    case "turnLeft":
      return { kind: "turn", rotation: "left" };
    case "attack":
      return { kind: "attack" };
    case "loadAttack":
      return { kind: "loadAttack" };
    case "wait":
      return { kind: "wait" };
    default: {
      // 新コマンド追加時の漏れを型で検出する。
      const _exhaustive: never = cmd;
      throw new Error(`Unknown command: ${String(_exhaustive)}`);
    }
  }
}

/** 式（クエリ）を評価して真偽を返す。CQS の query 層の入口。状態は変えない。 */
export function evalExpr(expr: Expr, state: BattleState, selfId: AutomatonId): boolean {
  switch (expr.kind) {
    case "sensor":
      return evalSensor(expr.sensor, state, selfId);
    case "literal":
      return expr.value;
    default: {
      const _exhaustive: never = expr;
      throw new Error(`Unknown expr: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

/** センサ（状態への純粋な問い合わせ）を評価する。状態は変えない。 */
export function evalSensor(sensor: SensorName, state: BattleState, selfId: AutomatonId): boolean {
  const self = state.automatons.find((e) => e.id === selfId);
  if (!self) return false;
  const front = frontCell(self.pos, self.dir);
  switch (sensor) {
    case "wallAhead":
      return isWall(state.grid, front);
    case "enemyAhead": {
      const other = state.automatons.find((e) => e.id !== selfId && samePos(e.pos, front));
      return other !== undefined;
    }
    default: {
      const _exhaustive: never = sensor;
      throw new Error(`Unknown sensor: ${String(_exhaustive)}`);
    }
  }
}

function decideWinner(automatons: readonly Automaton[]): Winner | null {
  const ally = automatons.find((e) => e.id === "ally");
  const enemy = automatons.find((e) => e.id === "enemy");
  const allyDead = !ally || ally.hp <= 0;
  const enemyDead = !enemy || enemy.hp <= 0;
  if (allyDead && enemyDead) return "draw";
  if (enemyDead) return "ally";
  if (allyDead) return "enemy";
  return null;
}

// BP を amount だけ上げた新しいオートマトンを返す。
// 上限に達したら過負荷フリーズを発動する：BP を放電（0 に戻し）、数クロック行動不能にする。
function withBpRaised(a: Automaton, amount: number, params: BattleParams): Automaton {
  const bp = a.bp + amount;
  if (bp >= params.bpMax) {
    return { ...a, bp: 0, freezeRemaining: params.freezeClocks };
  }
  return { ...a, bp };
}

/**
 * 1体のオートマトンの1アクションを状態に適用する（クロックは進めない）。
 *
 * バトルループが行動順に従って1体ずつ呼ぶ。後手は先手の行動を反映した最新状態を見て動くため、
 * 「2体が同じマスを同時に奪い合う」矛盾が原理的に起きず、アドホックな衝突回避が不要になる。
 * 移動は壁・場外・他オートマトンのいるマスへは進めない。攻撃は前方マスの相手に当たる。
 * フリーズ中（freezeRemaining > 0）はコマンドが wait に強制上書きされ、何も起きない。
 */
export function applyAction(
  state: BattleState,
  selfId: AutomatonId,
  action: Action,
  params: BattleParams = BATTLE_PARAMS,
): BattleState {
  if (state.winner !== null) return state; // 決着後は進めない
  const self = state.automatons.find((e) => e.id === selfId);
  if (!self) return state;
  if (self.freezeRemaining > 0) return state; // フリーズ中は wait 相当（コマンドは消費済み）

  let automatons = state.automatons;
  let logs = state.logs;

  switch (action.kind) {
    case "move": {
      const t = frontCell(self.pos, self.dir);
      const blocked = isWall(state.grid, t) || automatons.some((o) => o.id !== selfId && samePos(o.pos, t));
      if (!blocked) {
        automatons = automatons.map((e) => (e.id === selfId ? { ...e, pos: t } : e));
      }
      break;
    }
    case "turn": {
      automatons = automatons.map((e) => (e.id === selfId ? { ...e, dir: rotate(e.dir, action.rotation) } : e));
      break;
    }
    case "attack": {
      const front = frontCell(self.pos, self.dir);
      const idx = automatons.findIndex((o) => o.id !== selfId && samePos(o.pos, front));
      if (idx >= 0) {
        const tgt = automatons[idx];
        const hp = tgt.hp - params.attackDamage;
        // 命中時：相手に HP ダメージ、自分は重い処理で BP が上がる（ハイリスク）。
        automatons = automatons.map((e, i) => {
          if (i === idx) return { ...e, hp };
          if (e.id === selfId) return withBpRaised(e, params.attackSelfBp, params);
          return e;
        });
        logs = [
          ...logs,
          { clock: state.clock, attacker: selfId, target: tgt.id, damage: params.attackDamage, targetHpAfter: hp },
        ];
      }
      break;
    }
    case "loadAttack": {
      // 負荷攻撃（DDoS）：前方の相手の BP を上げる。HP は削らない。
      const front = frontCell(self.pos, self.dir);
      const idx = automatons.findIndex((o) => o.id !== selfId && samePos(o.pos, front));
      if (idx >= 0) {
        automatons = automatons.map((e, i) => (i === idx ? withBpRaised(e, params.loadAttackBp, params) : e));
      }
      break;
    }
    case "wait":
      break;
    default: {
      // 新アクション追加時の漏れを型で検出する。
      const _exhaustive: never = action;
      throw new Error(`Unknown action: ${JSON.stringify(_exhaustive)}`);
    }
  }

  // 何も変化しなければ（移動不成立・wait・空振り）元の状態をそのまま返す。
  if (automatons === state.automatons && logs === state.logs) return state;
  return { ...state, automatons, logs, winner: decideWinner(automatons) };
}

/**
 * 1クロック分の時間経過を適用する（全アクション解決後に1回呼ぶ）。
 *
 * フリーズ残クロックを 1 減らし、フリーズしていない体は BP を自然減（クールダウン）する。
 * クロックを 1 進める。HP は時間では変化しない。
 */
export function advanceClock(state: BattleState, params: BattleParams = BATTLE_PARAMS): BattleState {
  const automatons = state.automatons.map((a) => {
    if (a.freezeRemaining > 0) return { ...a, freezeRemaining: a.freezeRemaining - 1 };
    const bp = Math.max(0, a.bp - params.bpCooldownPerClock);
    return bp === a.bp ? a : { ...a, bp };
  });
  return { ...state, automatons, clock: state.clock + 1 };
}
