import { describe, it, expect } from "vitest";
import { programCost, runBattle, withAllyInitialHp } from "#lib/domain";
import type { Program } from "#lib/domain";
import {
  LEFT_WALL_FOLLOWER_SIMPLE,
  WALL_FOLLOWER_SIMPLE,
  allyHpAtCpMax,
  cpMax,
  fwd,
  left,
  right,
  winsWith,
} from "#lib/infrastructure/stages/stage-test-kit";
import { STILL_TARGET_STAGE } from "./still-target";
import { STANDING_SENTRY_STAGE } from "./standing-sentry";
import { APPROACHING_SENTRY_STAGE } from "./approaching-sentry";
import { PATROLLING_SENTRY_STAGE } from "./patrolling-sentry";
import { CIRCLING_SENTRY_STAGE } from "./circling-sentry";
import { NONSTOP_CIRCLING_SENTRY_STAGE } from "./nonstop-circling-sentry";
import { SWINGING_SENTRY_STAGE } from "./swinging-sentry";
import { MAZE_SENTRY_STAGE } from "./maze-sentry";

const attack = { kind: "call", cmd: "attack" } as const;
const wait = { kind: "call", cmd: "wait" } as const;
const enemyAhead = { kind: "sensor", sensor: "enemyAhead" } as const;
const forever = (body: Program): Program => [{ kind: "while", cond: { kind: "literal", value: true }, body }];

// 敵が前なら攻撃、いなければ進む（進んで攻撃・CP 4）。
const ADVANCE_AND_ATTACK: Program = forever([{ kind: "if", cond: enemyAhead, then: [attack], else: [fwd] }]);
// 敵が前なら攻撃、いなければ待つ（待ち伏せ・CP 4）。
const AMBUSH: Program = forever([{ kind: "if", cond: enemyAhead, then: [attack], else: [wait] }]);

describe("STILL_TARGET_STAGE（動かない的・攻撃の初出）", () => {
  const allyHp = allyHpAtCpMax(STILL_TARGET_STAGE);

  it("「敵が前なら攻撃、いなければ進む」のくりかえしで勝てる（CP 上限に収まる）", () => {
    expect(programCost(ADVANCE_AND_ATTACK)).toBeLessThanOrEqual(cpMax(STILL_TARGET_STAGE));
    expect(winsWith(STILL_TARGET_STAGE, ADVANCE_AND_ATTACK, allyHp)).toBe("ally");
  });

  it("ベタ書き（進む×3 → 攻撃×4）でも勝てる＝入門としてセンサは強制しない", () => {
    const straight: Program = [
      { kind: "repeat", count: 3, body: [fwd] },
      { kind: "repeat", count: 4, body: [attack] },
    ];
    expect(winsWith(STILL_TARGET_STAGE, straight, allyHp)).toBe("ally");
  });

  it("攻撃しないと勝てない（的は自壊しない）", () => {
    expect(winsWith(STILL_TARGET_STAGE, forever([fwd]), allyHp)).not.toBe("ally");
  });
});

describe("STANDING_SENTRY_STAGE（立ちはだかる見張り・攻撃される脅威の初出）", () => {
  const allyHp = allyHpAtCpMax(STANDING_SENTRY_STAGE);

  it("進んで攻撃し合えば HP の差で競り勝てるが、HP は削られる", () => {
    const state = withAllyInitialHp(STANDING_SENTRY_STAGE.initial, allyHp);
    const { result } = runBattle(state, ADVANCE_AND_ATTACK, STANDING_SENTRY_STAGE.enemy);
    expect(result.winner).toBe("ally");
    const allyAfter = result.finalState.automatons.find((a) => a.id === "ally");
    expect(allyAfter?.hp).toBeLessThan(allyHp);
  });
});

describe("APPROACHING_SENTRY_STAGE（向かってくる見張り・待ち構えて先手を取る）", () => {
  const allyHp = allyHpAtCpMax(APPROACHING_SENTRY_STAGE);

  it("その場で待ち構えれば、正面に入ってきた見張りに先に攻撃して競り勝てる（CP 上限に収まる）", () => {
    expect(programCost(AMBUSH)).toBeLessThanOrEqual(cpMax(APPROACHING_SENTRY_STAGE));
    expect(winsWith(APPROACHING_SENTRY_STAGE, AMBUSH, allyHp)).toBe("ally");
  });

  it("前の面の「進んで攻撃」は自分から正面に入って先に攻撃され、1発差で競り負ける", () => {
    expect(winsWith(APPROACHING_SENTRY_STAGE, ADVANCE_AND_ATTACK, allyHp)).not.toBe("ally");
  });
});

describe("PATROLLING_SENTRY_STAGE（往復する見張り・待ち伏せ）", () => {
  const allyHp = allyHpAtCpMax(PATROLLING_SENTRY_STAGE);

  it("くぼみで待ち伏せし、正面を通る瞬間に攻撃すれば勝てる（CP 上限に収まる）", () => {
    expect(programCost(AMBUSH)).toBeLessThanOrEqual(cpMax(PATROLLING_SENTRY_STAGE));
    expect(winsWith(PATROLLING_SENTRY_STAGE, AMBUSH, allyHp)).toBe("ally");
  });

  it("前の面の「進んで攻撃」は通路に出て横から攻撃され負ける", () => {
    expect(winsWith(PATROLLING_SENTRY_STAGE, ADVANCE_AND_ATTACK, allyHp)).not.toBe("ally");
  });

  it("通路に出て見張りを迎え撃つ（行く手をふさぐ）と、正面の殴り合いで競り負ける", () => {
    for (const turn of [left, right]) {
      const block: Program = [fwd, turn, ...AMBUSH];
      expect(winsWith(PATROLLING_SENTRY_STAGE, block, allyHp)).not.toBe("ally");
    }
  });

  it("通路に出て見張りを追いかけても、折り返した見張りと正面で殴り合いになり競り負ける", () => {
    for (const turn of [left, right]) {
      const chase: Program = [fwd, turn, ...ADVANCE_AND_ATTACK];
      expect(winsWith(PATROLLING_SENTRY_STAGE, chase, allyHp)).not.toBe("ally");
    }
  });
});

describe("CIRCLING_SENTRY_STAGE（回る見張り・背後から追いかける）", () => {
  const allyHp = allyHpAtCpMax(CIRCLING_SENTRY_STAGE);
  const resultWith = (program: Program) => {
    const state = withAllyInitialHp(CIRCLING_SENTRY_STAGE.initial, allyHp);
    return runBattle(state, program, CIRCLING_SENTRY_STAGE.enemy).result;
  };
  const wallAhead = { kind: "sensor", sensor: "wallAhead" } as const;
  // 敵が前なら攻撃、壁なら曲がる、そうでなければ進む（外周を回って追いかける・CP 6）。
  const circleTurning = (turn: typeof right | typeof left): Program =>
    forever([
      {
        kind: "if",
        cond: enemyAhead,
        then: [attack],
        else: [{ kind: "if", cond: wallAhead, then: [turn], else: [fwd] }],
      },
    ]);
  const stepThenAmbush: Program = [fwd, ...AMBUSH];

  it("1歩出て待ち伏せても勝てる", () => {
    expect(resultWith(stepThenAmbush).winner).toBe("ally");
  });

  it("右回りに追いかけると、待ち伏せより早く勝てる（CP 上限に収まる）", () => {
    const chase = circleTurning(right);
    expect(programCost(chase)).toBeLessThanOrEqual(cpMax(CIRCLING_SENTRY_STAGE));
    const result = resultWith(chase);
    expect(result.winner).toBe("ally");
    expect(result.clocks).toBeLessThan(resultWith(stepThenAmbush).clocks);
  });

  it("左回りでは見張りと正面から当たり、競り負ける", () => {
    expect(resultWith(circleTurning(left)).winner).not.toBe("ally");
  });

  it("中央に留まると、壁越しに見えず届かないので勝てない", () => {
    expect(resultWith(AMBUSH).winner).not.toBe("ally");
  });

  it("外周へ出て見張りを迎え撃つ（行く手をふさぐ）と、正面の殴り合いで競り負ける", () => {
    for (const turn of [left, right]) {
      expect(resultWith([fwd, fwd, turn, ...AMBUSH]).winner).not.toBe("ally");
    }
  });
});

describe("NONSTOP_CIRCLING_SENTRY_STAGE（止まらずに回る見張り・逆回りで迎え撃つ）", () => {
  const allyHp = allyHpAtCpMax(NONSTOP_CIRCLING_SENTRY_STAGE);
  const wallAhead = { kind: "sensor", sensor: "wallAhead" } as const;
  // 敵が前なら攻撃、壁なら曲がる、そうでなければ進む（外周を回る）。
  const circleTurning = (turn: typeof right | typeof left): Program =>
    forever([
      {
        kind: "if",
        cond: enemyAhead,
        then: [attack],
        else: [{ kind: "if", cond: wallAhead, then: [turn], else: [fwd] }],
      },
    ]);

  it("1クロック待ってから左回りで迎え撃つと、見張りが正面に入ってきて先手を取れて勝てる（CP 上限に収まる）", () => {
    const waitThenMeet: Program = [wait, ...circleTurning(left)];
    expect(programCost(waitThenMeet)).toBeLessThanOrEqual(cpMax(NONSTOP_CIRCLING_SENTRY_STAGE));
    expect(winsWith(NONSTOP_CIRCLING_SENTRY_STAGE, waitThenMeet, allyHp)).toBe("ally");
  });

  it("すぐ左回りで出ると、自分から見張りの正面に入って競り負ける", () => {
    expect(winsWith(NONSTOP_CIRCLING_SENTRY_STAGE, circleTurning(left), allyHp)).not.toBe("ally");
  });

  it("前の面の解（右回りに追いかける）は、同じ速さで追いつけず勝てない", () => {
    expect(winsWith(NONSTOP_CIRCLING_SENTRY_STAGE, circleTurning(right), allyHp)).not.toBe("ally");
  });

  it("1歩出て待ち伏せても勝てるが、迎え撃ちよりずっと遅い", () => {
    const state = withAllyInitialHp(NONSTOP_CIRCLING_SENTRY_STAGE.initial, allyHp);
    const ambush = runBattle(state, [fwd, ...AMBUSH], NONSTOP_CIRCLING_SENTRY_STAGE.enemy).result;
    const meet = runBattle(state, [wait, ...circleTurning(left)], NONSTOP_CIRCLING_SENTRY_STAGE.enemy).result;
    expect(ambush.winner).toBe("ally");
    expect(meet.clocks).toBeLessThan(ambush.clocks);
  });
});

describe("SWINGING_SENTRY_STAGE（首をふる見張り・タイミングか死角で近づく）", () => {
  const allyHp = allyHpAtCpMax(SWINGING_SENTRY_STAGE);
  const wallAhead = { kind: "sensor", sensor: "wallAhead" } as const;
  const repeat = (count: number, body: Program): Program => [{ kind: "repeat", count, body }];
  // 東へ3歩→右折で見張りの北に着き南を向く。
  const fromNorth: Program = [...repeat(3, [fwd]), right, ...AMBUSH];
  // 壁で右折しながら進み、上の列の東端から下りて見張りの東に着く（死角）。
  const toBlindSide: Program = forever([
    {
      kind: "if",
      cond: enemyAhead,
      then: [attack],
      else: [{ kind: "if", cond: wallAhead, then: [right], else: [fwd] }],
    },
  ]);

  it("1クロック待ってから北へ寄れば、見張りが西を向いている間に攻撃して勝てる（CP 上限ちょうど）", () => {
    const waitThenNorth: Program = [wait, ...fromNorth];
    expect(programCost(waitThenNorth)).toBeLessThanOrEqual(cpMax(SWINGING_SENTRY_STAGE));
    expect(winsWith(SWINGING_SENTRY_STAGE, waitThenNorth, allyHp)).toBe("ally");
  });

  it("すぐ北へ寄ると、北を向いた見張りの正面に自分から入って競り負ける", () => {
    expect(winsWith(SWINGING_SENTRY_STAGE, fromNorth, allyHp)).not.toBe("ally");
  });

  it("壁で右折しながら進むと、見張りが見ない東から攻撃して勝てる（CP 上限に収まる）", () => {
    expect(programCost(toBlindSide)).toBeLessThanOrEqual(cpMax(SWINGING_SENTRY_STAGE));
    expect(winsWith(SWINGING_SENTRY_STAGE, toBlindSide, allyHp)).toBe("ally");
  });

  it("西へ回り込む経路は CP 上限を超える", () => {
    const fromWest: Program = [right, fwd, left, ...repeat(2, [fwd]), ...AMBUSH];
    expect(programCost(fromWest)).toBeGreaterThan(cpMax(SWINGING_SENTRY_STAGE));
  });

  it("進んで攻撃では見張りの隣に着けず勝てない", () => {
    expect(winsWith(SWINGING_SENTRY_STAGE, ADVANCE_AND_ATTACK, allyHp)).not.toBe("ally");
  });
});

describe("MAZE_SENTRY_STAGE（迷路の見張り・総仕上げ）", () => {
  // CP を厚く取る配分（HP 8・CP 16）と、HP を厚く取る配分（HP 16・CP 8）。
  const hpWithLargeCp = allyHpAtCpMax(MAZE_SENTRY_STAGE);
  const hpWithSmallCp = MAZE_SENTRY_STAGE.memoryTotal - MAZE_SENTRY_STAGE.memoryGrain;
  // 壁沿い（簡略形）のくりかえしの先頭に「敵が前なら攻撃」を置く（CP 8）。
  const attackFirst = (follower: Program): Program => {
    const [loop] = follower;
    if (loop.kind !== "while") throw new Error("follower must be a while loop");
    return forever([{ kind: "if", cond: enemyAhead, then: [attack], else: loop.body }]);
  };

  it("CP を厚く取れば、右手法の前に1クロック待つと見張りとの出会い方が変わって勝てる", () => {
    const waitThenRight: Program = [wait, ...attackFirst(WALL_FOLLOWER_SIMPLE)];
    expect(programCost(waitThenRight)).toBeLessThanOrEqual(cpMax(MAZE_SENTRY_STAGE));
    expect(winsWith(MAZE_SENTRY_STAGE, attackFirst(WALL_FOLLOWER_SIMPLE), hpWithLargeCp)).not.toBe("ally");
    expect(winsWith(MAZE_SENTRY_STAGE, waitThenRight, hpWithLargeCp)).toBe("ally");
  });

  it("左手法に変えれば、待たずに勝てる", () => {
    expect(winsWith(MAZE_SENTRY_STAGE, attackFirst(LEFT_WALL_FOLLOWER_SIMPLE), hpWithLargeCp)).toBe("ally");
  });

  it("HP を厚く取れば、待たずに右手法のまま正面から押し切れる（配分のトレードオフ）", () => {
    expect(winsWith(MAZE_SENTRY_STAGE, attackFirst(WALL_FOLLOWER_SIMPLE), hpWithSmallCp)).toBe("ally");
  });

  it("攻撃を足さない壁沿いだけでは、出会っても攻撃できず勝てない", () => {
    expect(winsWith(MAZE_SENTRY_STAGE, WALL_FOLLOWER_SIMPLE, hpWithSmallCp)).not.toBe("ally");
  });
});
