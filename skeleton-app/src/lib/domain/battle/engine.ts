/**
 * バトルポッドの純粋ロジック：グリッド計算・センサ評価・コマンド変換・1クロックの状態遷移。
 *
 * すべて決定的な純関数。乱数・時刻・DOM に依存しない。
 */

import type {
  Action,
  Automaton,
  AutomatonId,
  BattleState,
  CommandName,
  DamageLog,
  Direction,
  Grid,
  Position,
  SensorName,
  Winner,
} from "../models/types";

// PoC では固定値。将来はキャラ/武器のパラメータ化を想定。
const ATTACK_DAMAGE = 1;

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
    case "wait":
      return { kind: "wait" };
    default: {
      // 新コマンド追加時の漏れを型で検出する。
      const _exhaustive: never = cmd;
      throw new Error(`Unknown command: ${String(_exhaustive)}`);
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

/**
 * 1クロック分の状態遷移。各オートマトンの1アクションを同時に解決する。
 *
 * 解決順は「移動 → 攻撃」。攻撃は移動後の位置・向きで前方マスの相手に当たる。
 * この順序を固定することで、同時行動でも結果が決定的になる。
 */
export function applyTick(state: BattleState, actions: ReadonlyMap<AutomatonId, Action>): BattleState {
  if (state.winner !== null) return state; // 決着後は進めない

  const automatons = state.automatons;

  // 1) 移動の解決：壁・場外・現在他オートマトンがいるマスへは進めない
  const targets = new Map<AutomatonId, Position>();
  for (const e of automatons) {
    if (actions.get(e.id)?.kind !== "move") continue;
    const t = frontCell(e.pos, e.dir);
    const blocked = isWall(state.grid, t) || automatons.some((o) => o.id !== e.id && samePos(o.pos, t));
    if (!blocked) targets.set(e.id, t);
  }
  // 2体が同じマスを目指した場合は双方不成立（重なり・すり抜けを防ぐ）
  const entries = [...targets.entries()];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (samePos(entries[i][1], entries[j][1])) {
        targets.delete(entries[i][0]);
        targets.delete(entries[j][0]);
      }
    }
  }

  // 位置・向きの更新（移動 or 旋回 or それ以外）
  const moved: Automaton[] = automatons.map((e) => {
    const act = actions.get(e.id) ?? { kind: "wait" };
    if (act.kind === "move") {
      const t = targets.get(e.id);
      return t ? { ...e, pos: t } : e;
    }
    if (act.kind === "turn") {
      return { ...e, dir: rotate(e.dir, act.rotation) };
    }
    return e;
  });

  // 2) 攻撃の解決：移動後の位置・向きで前方マスの相手にダメージ
  const next = [...moved];
  const logs: DamageLog[] = [];
  for (const e of moved) {
    if (actions.get(e.id)?.kind !== "attack") continue;
    const front = frontCell(e.pos, e.dir);
    const idx = next.findIndex((o) => o.id !== e.id && samePos(o.pos, front));
    if (idx >= 0) {
      const tgt = next[idx];
      const hp = tgt.hp - ATTACK_DAMAGE;
      next[idx] = { ...tgt, hp };
      logs.push({ clock: state.clock, attacker: e.id, target: tgt.id, damage: ATTACK_DAMAGE, targetHpAfter: hp });
    }
  }

  return {
    ...state,
    automatons: next,
    clock: state.clock + 1,
    logs: [...state.logs, ...logs],
    winner: decideWinner(next),
  };
}
