import { describe, it, expect } from "vitest";
import { runBattle, recordBattle } from "./loop";
import type { Automaton, BattleState } from "./model";
import type { BattleParams } from "./params";
import type { Program } from "$lib/domain/program";

// --- テスト用ヘルパー ---

function automaton(
  id: Automaton["id"],
  x: number,
  dir: Automaton["dir"],
  hp: number,
  // priority は既定で ally を高くしてプレイヤー先手。テストで上書き可。
  priority = id === "ally" ? 1 : 0,
): Automaton {
  return { id, pos: { x, y: 0 }, dir, hp, bp: 0, freezeRemaining: 0, priority };
}

// 幅 width・高さ1 の一本道。自キャラ（Ally）は左端で右向き、敵キャラ（Enemy）は右の方で左向き。
function corridor(width: number, enemyX: number, allyHp = 3, enemyHp = 3): BattleState {
  return {
    grid: { width, height: 1, walls: [] },
    automatons: [automaton("ally", 0, "right", allyHp), automaton("enemy", enemyX, "left", enemyHp)],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  };
}

// 突進し続けるだけの敵（攻撃しない）。
const CHARGER: Program = [{ kind: "repeat", count: 100, body: [{ kind: "call", cmd: "stepForward" }] }];

// 何もしない的（移動チュートリアルの敵）。
const DUMMY: Program = [];

// 敵が前にいれば攻撃、いなければ前進する「対抗」プログラム。
const COUNTER: Program = [
  {
    kind: "repeat",
    count: 100,
    body: [
      {
        kind: "if",
        cond: { kind: "sensor", sensor: "enemyAhead" },
        then: [{ kind: "call", cmd: "attack" }],
        else: [{ kind: "call", cmd: "stepForward" }],
      },
    ],
  },
];

// ただ前進し続けるだけの素朴なプログラム。
const NAIVE: Program = [{ kind: "repeat", count: 100, body: [{ kind: "call", cmd: "stepForward" }] }];

describe("runBattle（逐次実行・プレイヤー先手）", () => {
  it("決定的：同じ入力なら必ず同じ結果になる", () => {
    const a = runBattle(corridor(6, 3), COUNTER, CHARGER);
    const b = runBattle(corridor(6, 3), COUNTER, CHARGER);
    expect(a.winner).toBe(b.winner);
    expect(a.clocks).toBe(b.clocks);
    expect(a.finalState.logs).toEqual(b.finalState.logs);
  });

  it("敵の動きを読んで対抗すると勝てる（COUNTER が CHARGER を倒す）", () => {
    const result = runBattle(corridor(6, 3), COUNTER, CHARGER);
    expect(result.winner).toBe("ally");
    const enemy = result.finalState.automatons.find((e) => e.id === "enemy");
    expect(enemy?.hp).toBeLessThanOrEqual(0);
  });

  it("正面衝突の初期距離が偶数でも勝てる（逐次解決で隣接が成立する）", () => {
    // 幅7・敵 x=6＝距離6（偶数）。同時適用だと中央マスの奪い合いで膠着→引き分けになっていたケース。
    // 逐次解決では先手 ally が中央へ進み、後手 enemy は埋まったマスへ進めず隣接が成立して交戦できる。
    const result = runBattle(corridor(7, 6), COUNTER, CHARGER);
    expect(result.winner).toBe("ally");
  });

  it("素朴に突進するだけだと勝てない（NAIVE vs CHARGER は膠着で引き分け）", () => {
    const result = runBattle(corridor(6, 3), NAIVE, CHARGER);
    expect(result.winner).toBe("draw");
    // 膠着を検出して maxClocks に達する前に打ち切れている
    expect(result.clocks).toBeLessThan(1000);
  });

  it("移動チュートリアル：動かない敵に近づいて撃破できる", () => {
    const result = runBattle(corridor(6, 4, 3, 2), COUNTER, DUMMY);
    expect(result.winner).toBe("ally");
  });
});

describe("試運転（ignoreWinner：勝敗で打ち切らない）", () => {
  // 試運転の「何もいない」相当：敵不在の盤で ally だけ走らせる。
  // 通常は decideWinner が敵不在を即「ally 勝利」とみなし1クロックで止まるが、
  // ignoreWinner では止めず、ally が前進し続けられること。
  function allyOnly(width: number): BattleState {
    return {
      grid: { width, height: 1, walls: [] },
      automatons: [automaton("ally", 0, "right", 3)],
      clock: 0,
      rngSeed: 0,
      logs: [],
      winner: null,
    };
  }

  it("敵不在でも即決着せず、ally が前進して盤を進む", () => {
    const frames = recordBattle(allyOnly(5), NAIVE, [], { ignoreWinner: true });
    // 決着で打ち切られていない（winner はどのフレームでも付かない）。
    expect(frames.every((f) => f.winner === null)).toBe(true);
    // 右端(x=4)まで前進できている＝1クロックで止まっていない。
    const ally = frames[frames.length - 1].automatons.find((e) => e.id === "ally");
    expect(ally?.pos.x).toBe(4);
  });
});

describe("行動順（priority）", () => {
  const ATTACK: Program = [{ kind: "call", cmd: "attack" }];

  // 隣接・相対・両者 hp1・両者 attack の一騎打ち。先に殴った方が勝つ。
  function duel(allyPriority: number, enemyPriority: number): BattleState {
    return {
      grid: { width: 2, height: 1, walls: [] },
      automatons: [automaton("ally", 0, "right", 1, allyPriority), automaton("enemy", 1, "left", 1, enemyPriority)],
      clock: 0,
      rngSeed: 0,
      logs: [],
      winner: null,
    };
  }

  it("priority の高い方が先に行動する（同時攻撃は先手が勝つ）", () => {
    expect(runBattle(duel(1, 0), ATTACK, ATTACK).winner).toBe("ally");
    expect(runBattle(duel(0, 1), ATTACK, ATTACK).winner).toBe("enemy");
  });
});

describe("BP（負荷攻撃・過負荷フリーズ）", () => {
  // 具体値には結合させず、テスト側で明示的に params を注入する。
  // 負荷攻撃1発で上限到達＝即フリーズする、検証しやすい設定。
  const params: BattleParams = {
    attackDamage: 1,
    bpMax: 10,
    loadAttackBp: 10,
    attackSelfBp: 2,
    freezeClocks: 2,
    bpCooldownPerClock: 1,
  };

  // 隣接した敵に負荷攻撃を撃ち続けるだけのプログラム。
  const DDOS: Program = [{ kind: "repeat", count: 100, body: [{ kind: "call", cmd: "loadAttack" }] }];

  // ally(x0,右) と enemy(x1,左) が隣接する幅2の盤面。
  function adjacent(): BattleState {
    return {
      grid: { width: 2, height: 1, walls: [] },
      automatons: [automaton("ally", 0, "right", 3), automaton("enemy", 1, "left", 3)],
      clock: 0,
      rngSeed: 0,
      logs: [],
      winner: null,
    };
  }

  it("負荷攻撃を受けると過負荷フリーズに陥る", () => {
    const frames = recordBattle(adjacent(), DDOS, DUMMY, { params });
    const frozen = frames.some((f) => (f.automatons.find((e) => e.id === "enemy")?.freezeRemaining ?? 0) > 0);
    expect(frozen).toBe(true);
  });

  it("負荷攻撃は HP を削らない（BP だけでは撃破できず引き分け）", () => {
    const result = runBattle(adjacent(), DDOS, DUMMY, { params });
    expect(result.winner).toBe("draw");
    const enemy = result.finalState.automatons.find((e) => e.id === "enemy");
    expect(enemy?.hp).toBe(3);
  });
});

describe("センサ（wallAhead）", () => {
  it("道がある間は前進し、壁（場外）の手前では前進せず旋回する", () => {
    // 幅3の一本道。ally は x=1 右向き、enemy は x=0（検証に無関係・DUMMY）。
    const state: BattleState = {
      grid: { width: 3, height: 1, walls: [] },
      automatons: [automaton("ally", 1, "right", 3), automaton("enemy", 0, "left", 1)],
      clock: 0,
      rngSeed: 0,
      logs: [],
      winner: null,
    };
    // 壁があれば右回転、なければ前進。
    const program: Program = [
      {
        kind: "repeat",
        count: 2,
        body: [
          {
            kind: "if",
            cond: { kind: "sensor", sensor: "wallAhead" },
            then: [{ kind: "call", cmd: "turnRight" }],
            else: [{ kind: "call", cmd: "stepForward" }],
          },
        ],
      },
    ];
    // 1手目: 前方(2,0)は道 → 前進して x=2。2手目: 前方(3,0)は場外=壁 → 旋回して向きが down に。
    const result = runBattle(state, program, DUMMY, { maxClocks: 10 });
    const ally = result.finalState.automatons.find((e) => e.id === "ally");
    expect(ally?.pos.x).toBe(2);
    expect(ally?.dir).toBe("down");
  });
});
