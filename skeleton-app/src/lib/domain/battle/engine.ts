/**
 * 状態遷移：コマンド→アクション変換と、1アクション/1クロックの盤面更新（CQS の command 層）。
 *
 * 盤面の幾何（移動先・通行判定）は grid に委ね、ここは状態の更新に徹する。
 */

import type { Action, CommandName } from "$lib/domain/program";
import type { Automaton, AutomatonId, BattleState, Winner } from "./model";
import { frontCell, isBlocked, rotate, arePositionsEqual } from "./grid";
import { BATTLE_PARAMS, type BattleParams } from "./params";

/** コマンド名を、状態非依存のアクションに変換する。 */
export const commandToAction = (cmd: CommandName): Action => {
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
    case "brittleAttack":
      return { kind: "brittleAttack" };
    case "wait":
      return { kind: "wait" };
    default: {
      // 新コマンド追加時の漏れを型で検出する。
      const _exhaustive: never = cmd;
      throw new Error(`Unknown command: ${String(_exhaustive)}`);
    }
  }
};

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
      const blocked =
        isBlocked(state.grid, self.pos, t) || automatons.some((o) => o.id !== selfId && arePositionsEqual(o.pos, t));
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
      const idx = automatons.findIndex((o) => o.id !== selfId && arePositionsEqual(o.pos, front));
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
      const idx = automatons.findIndex((o) => o.id !== selfId && arePositionsEqual(o.pos, front));
      if (idx >= 0) {
        automatons = automatons.map((e, i) => (i === idx ? withBpRaised(e, params.loadAttackBp, params) : e));
      }
      break;
    }
    case "brittleAttack": {
      // brittleAttack（暴発のみ）：前方に相手がいる時だけ発動し、相手は無傷・自分の HP が 0 になる（自壊）。
      // 空振り（前方に相手なし）は無害。敵の「脆弱性」を位置取りで突いて勝たせる Chap1 の勝ち筋。
      const front = frontCell(self.pos, self.dir);
      const hasTarget = automatons.some((o) => o.id !== selfId && arePositionsEqual(o.pos, front));
      if (hasTarget) {
        automatons = automatons.map((e) => (e.id === selfId ? { ...e, hp: 0 } : e));
        logs = [...logs, { clock: state.clock, attacker: selfId, target: selfId, damage: self.hp, targetHpAfter: 0 }];
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
