import type { Stage } from "#lib/application";
import type { Program } from "#lib/domain";
import { BASIC_SENTRY, TURTLE_V5 } from "#lib/domain";
import { parseStageMap } from "#lib/infrastructure/stages/stage-map";

// 見張りは (3,1) で首を振り、西→北→西… と向きを変える（向きを変えて1クロック待つ・4 クロックで1往復）。
// 西と北をそれぞれ半分の時間見ており、東は一度も見ない（死角）。盤は2行なので南からは寄れない。
// ally は左上 (0,0) から東を向いて出発する。出発時、見張りは西を向いている。
// 勝ち筋は CP 上限内に2つ:
// - タイミングを合わせて北から寄る: 1クロック待ってから東へ3歩・右折（CP 8・残り HP 2）。
//   すぐ寄ると、着いた時に見張りが北を向いている＝自分から正面に入り、先に1発受けて HP 8 対 8 で競り負ける。
//   2クロック待っても勝つが CP 9 で上限を超える。
// - 死角の東へ回り込む: 「敵が前なら攻撃・壁なら右折・そうでなければ進む」（CP 6・残り HP 7）。
//   上の列を東端まで進んで下り、西を向いて見張りの東に着く。途中 (3,0) を通る時に北を向いた見張りから1発受ける。
// 西へ回り込む経路は CP 上限を超える（右折→1歩→左折→東へ2歩で CP 9）。
// 見張りは向きを変える前に毎回正面を確かめ、相手がいる間は攻撃を続ける＝一度正面を取られると殴り合いになる。
// 待機は盤面が変わらないと膠着（引き分け）と判定されるため、見張りの待機は1クロックにとどめる。

// 正面（隣1マス）に相手がいる間は攻撃し、いなければ首を振る見張り（西と北を交互に向く）。
const SWINGING_SENTRY_PROGRAM: Program = [
  {
    kind: "while",
    cond: { kind: "literal", value: true },
    body: [
      {
        kind: "while",
        cond: { kind: "sensor", sensor: "enemyAhead" },
        body: [{ kind: "call", cmd: "attack" }],
      },
      { kind: "call", cmd: "turnRight" }, // 西→北
      { kind: "call", cmd: "wait" },
      {
        kind: "while",
        cond: { kind: "sensor", sensor: "enemyAhead" },
        body: [{ kind: "call", cmd: "attack" }],
      },
      { kind: "call", cmd: "turnLeft" }, // 北→西
      { kind: "call", cmd: "wait" },
    ],
  },
];

const SWINGING_SENTRY_MAP = parseStageMap(`
  +---+---+---+---+---+
  | A>  .   .   .   . |
  +   +   +   +   +   +
  | .   .   .   E<  . |
  +---+---+---+---+---+
`);

export const SWINGING_SENTRY_STAGE: Stage = {
  id: "swinging-sentry",
  label: "監視する敵", // TODO: 命名は暫定。敵のふるまい由来
  goal: "見張りは首を振ってまわりを見ている。見ていない時や見ていない側をねらって近づこう",
  enemy: SWINGING_SENTRY_PROGRAM,
  enemyLabel: "歩哨", // TODO: 敵の表示名は暫定
  enemyBaseImage: BASIC_SENTRY,
  allowedImages: [TURTLE_V5],
  memoryTotal: 16, // memoryGrain の倍数であること（CapacityAllocator の invariant）
  memoryGrain: 8,

  initial: {
    grid: SWINGING_SENTRY_MAP.grid,
    automatons: [
      // ally の hp=0 はデプロイ前の表示（未出撃＝空バー）用。対戦時は memoryTotal から配分した個体値で上書きされる。
      { id: "ally", ...SWINGING_SENTRY_MAP.ally, hp: 0, bp: 0, freezeRemaining: 0, priority: 1 },
      // 正面の殴り合い（自分から入る）では競り負ける値（7 以下だと、待たずに北から寄っても勝ててしまう）。
      { id: "enemy", ...SWINGING_SENTRY_MAP.enemy, hp: 8, bp: 0, freezeRemaining: 0, priority: 0 },
    ],
    clock: 0,
    rngSeed: 0,
    logs: [],
    winner: null,
  },
};
