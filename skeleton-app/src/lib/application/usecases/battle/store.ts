/**
 * バトルポッド（観戦セッション）の状態＝唯一の真実。
 *
 * 1回の対戦セッションが所有する「対の実体」：ally=デプロイ済みイメージ／enemy・initial=ステージ。
 * ステージ定義はプレゼン（route）が URL から解決して openSession で渡す（供給元の選択はプレゼンの役目）。
 * registry/workbench と同じ CQRS 分離：読みは readonly 投影を購読、書きは facade コマンド（openSession/deploy）。
 * 再生位置（frameIndex/playing）は観戦 UI の状態なのでプレゼンが持つ（ここには置かない）。
 *
 * 行投影・ログ・run・hash は「所有 state の純投影」＝外部から program を受け取るラッパーではなく、
 * セッションが所有する deployedImage／stage を集約した参照ビュー（draftLines が workbench 投影であるのと同じ）。
 */

import { derived, get, readonly, writable } from "svelte/store";
import { runBattle, resolveBattleParams, imageHash, flatLines, withAllyInitialHp, programCost } from "#lib/domain";
import type { AutomatonImage, BattleParams, BattleRun, FlatLine } from "#lib/domain";
import type { Stage } from "#lib/application/ports/stageRepository";
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

/** 観戦セッションの所有 state。stage=このセッションのステージ、deployed=出撃した ally の実体。 */
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

/** 起動エラーの内訳。CP 超過＝デプロイ済みイメージの消費 CP が割り当て CP を上回り、自動機が起動できない。 */
export interface LaunchError {
  // 割り当て CP を上回った量（構築側の配分 UI の「超過」と同じ量）。
  readonly cpOverflow: number;
}

/** デプロイ済みイメージの消費 CP（ブロック総数）。未デプロイは null。 */
export const deployedCpUsed = derived(sessionStore, (session): number | null =>
  session.deployed === null ? null : programCost(session.deployed.program),
);

/** enemy（ステージ固定）イメージの消費 CP。ally と同じ算出で左右対称に見せる。未セッションは null。 */
export const enemyCpUsed = derived(sessionStore, (session): number | null =>
  session.stage === null ? null : programCost(session.stage.enemy),
);

/**
 * 起動エラー＝デプロイは受け付けたが起動に失敗した状態の投影（docker run がメモリ不足で起動しない相当）。
 * 割り当て CP は配分の裏返し（総メモリ − 配分 HP）なので、デプロイ時の allyHp から復元できる。未デプロイ／起動成功は null。
 */
export const launchError = derived([sessionStore, deployedCpUsed], ([session, cpUsed]): LaunchError | null => {
  if (session.stage === null || session.deployed === null || cpUsed === null) return null;
  const cpAllocated = session.stage.memoryTotal - session.deployed.allyHp;
  return cpUsed > cpAllocated ? { cpOverflow: cpUsed - cpAllocated } : null;
});

/** 対戦結果（観戦フレーム列＋勝敗）＝所有 state の投影。未デプロイ／起動エラー／未セッションは null。 */
export const battleRun = derived(
  [sessionStore, battleParams, launchError],
  ([session, params, error]): BattleRun | null => {
    if (session.stage === null || session.deployed === null || error !== null) return null;
    // ally の初期 HP はステージ固有値ではなく配分の個体値＝初期盤面へデプロイ値を差し込んでから回す。
    const initial = withAllyInitialHp(session.stage.initial, session.deployed.allyHp);
    return runBattle(initial, session.deployed.program, session.stage.enemy, { params });
  },
);

/**
 * HP バーの満タン基準＝オートマトン id → 満タン HP の対応。
 * enemy はステージ初期配置の HP、ally は出撃時に配分した個体値（deployed.allyHp）。
 * 未デプロイは配分未確定（メモリ未供給）なので null＝購読側は容量を「—」として描く。
 * 未セッション（stage=null）は空＝購読側は満タン基準を得られないが、効果と同じく CSR では描画前に埋まる。
 */
export const maxHpById = derived(sessionStore, (session): Record<string, number | null> => {
  if (session.stage === null) return {};
  const byInitial = Object.fromEntries(session.stage.initial.automatons.map((a) => [a.id, a.hp]));
  return { ...byInitial, ally: session.deployed?.allyHp ?? null };
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
