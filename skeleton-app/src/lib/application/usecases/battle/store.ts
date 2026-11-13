/**
 * バトルポッド（観戦セッション）の状態＝唯一の真実。
 *
 * 1回の対戦セッションが所有する「対の実体」：ally=デプロイ済みイメージ／enemy・initial=ステージ。
 * ステージ定義はプレゼン（route）が URL から解決して openSession で渡す（供給元の選択はプレゼンの役目）。
 * registry/workbench と同じ CQRS 分離：読みは readonly 投影を購読、書きは facade コマンド（openSession/deploy）。
 * 再生位置（frameIndex/playing）は観戦 UI の状態なのでプレゼンが持つ（ここには置かない）。
 *
 * 行投影・ログ・run・hash は「所有 state の純投影」＝外部から program を受け取るラッパーではなく、
 * セッションが所有する deployedImage／stage を畳んだ読みモデル（draftLines が workbench 投影であるのと同じ）。
 */

import { derived, get, readonly, writable } from "svelte/store";
import { runBattle, resolveBattleParams, imageHash, flatLines, withAllyInitialHp } from "$lib/domain";
import type { AutomatonImage, BattleParams, BattleRun, FlatLine } from "$lib/domain";
import type { Stage } from "$lib/application/ports/stageRepository";
import { buildActionLog, type ActionLogRow } from "./actionLog";

/**
 * デプロイ済みイメージ＝出撃した ally の実体＝オートマトンイメージ（program+baseImage）に出撃メタを足した特化形。
 * プログラム・素質・表示名・出撃時刻は一体で、別々に欠けることはない（未デプロイは集合体ごと null）。
 */
export interface DeployedImage extends AutomatonImage {
  // 表示名（タグ）。観戦側イメージタイルに出す。
  readonly name: string;
  // 初期 HP＝デプロイ時にメモリ総量（stage.memoryTotal）から配分した個体値。ステージ固有値ではなく出撃ごとに決まる。
  readonly allyHp: number;
  // 出撃時刻（復元点の目印・ドリフト表示の起点）。
  readonly deployedAt: number;
}

/** 観戦セッションの所有 state。stage=このセッションの舞台、deployed=出撃した ally の実体。 */
export interface BattleSession {
  readonly stage: Stage | null;
  // 出撃した ally の実体（未デプロイは null）。
  readonly deployed: DeployedImage | null;
}

const INITIAL_SESSION: BattleSession = { stage: null, deployed: null };

// 内部の可変セッション。writable を外に晒さず、読みは readonly、書きは storeWriter 経由に限る。
const sessionStore = writable<BattleSession>(INITIAL_SESSION);

/** セッションの所有 state（readonly）。deployed* の生値はここから `$`購読する。 */
export const battleSession = readonly(sessionStore);

/**
 * セッションへの機械的な書き込み口（facade からのみ呼ぶ・UI には公開しない）。
 * 単一レコードなので workbench と同じく update/snapshot が機械的プリミティブ。
 */
export const storeWriter = {
  /** 現在のセッションを updater で差し替える（書き込みの単一経路）。 */
  update(updater: (session: BattleSession) => BattleSession): void {
    sessionStore.update(updater);
  },
  /** 現在のセッションのスナップショット（非追跡の一発読み）。 */
  snapshot(): BattleSession {
    return get(sessionStore);
  },
};

/**
 * このセッションに効く戦闘 params＝既定へステージ上書きを重ねた確定値の投影。
 * 合成規則（既定＋上書き）の実行はここ 1 点に集約し、run も表示も同じ解決値を共有する。
 */
export const battleParams = derived(sessionStore, (session): BattleParams =>
  resolveBattleParams(session.stage?.params),
);

/** 対戦結果（観戦フレーム列＋勝敗）＝所有 state の投影。未デプロイ／未セッションは null。 */
export const battleRun = derived([sessionStore, battleParams], ([session, params]): BattleRun | null => {
  if (session.stage === null || session.deployed === null) return null;
  // ally の初期 HP はステージ固有値ではなく配分の個体値＝初期盤面へデプロイ値を差し込んでから回す。
  const initial = withAllyInitialHp(session.stage.initial, session.deployed.allyHp);
  return runBattle(initial, session.deployed.program, session.stage.enemy, { params });
});

/** ally（デプロイ済み）の擬似コード行＝ProgramViewer に渡す View Model。 */
export const allyLines = derived(sessionStore, (session): FlatLine[] => flatLines(session.deployed?.program ?? []));

/** enemy（ステージ固定）の擬似コード行。 */
export const enemyLines = derived(sessionStore, (session): FlatLine[] => flatLines(session.stage?.enemy ?? []));

/** ally の行動ログ（全長）＝ActionLogViewer に渡す View Model。run 前は空。 */
export const allyLog = derived([battleRun, sessionStore], ([run, session]): ActionLogRow[] =>
  buildActionLog(run?.frames ?? [], session.deployed?.program ?? [], "ally"),
);

/** enemy の行動ログ（全長）。run 前は空。 */
export const enemyLog = derived([battleRun, sessionStore], ([run, session]): ActionLogRow[] =>
  buildActionLog(run?.frames ?? [], session.stage?.enemy ?? [], "enemy"),
);

/** ally（デプロイ済み）イメージの指紋。未デプロイは null。 */
export const deployedHash = derived(sessionStore, (session): string | null =>
  session.deployed === null ? null : imageHash(session.deployed),
);

/** enemy（ステージ固定）イメージの指紋。未セッションは null。ally と同じ image 粒度（program＋素質）で算出する。 */
export const enemyHash = derived(sessionStore, (session): string | null =>
  session.stage === null ? null : imageHash({ program: session.stage.enemy, baseImage: session.stage.enemyBaseImage }),
);
