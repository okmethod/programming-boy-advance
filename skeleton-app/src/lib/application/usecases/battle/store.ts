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
import { recordRun, hashProgram, flatLines } from "$lib/domain";
import type { BattleRun, FlatLine, Program } from "$lib/domain";
import type { Stage } from "$lib/application/ports/stageRepository";
import { buildActionLog, type ActionLogRow } from "./actionLog";

/** 観戦セッションの所有 state。stage=このセッションの舞台、deployed*=出撃した ally の実体。 */
export interface BattleSession {
  readonly stage: Stage | null;
  readonly deployedImage: Program | null;
  readonly deployedName: string;
  readonly deployedAt: number | null;
}

const INITIAL_SESSION: BattleSession = { stage: null, deployedImage: null, deployedName: "", deployedAt: null };

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

/** 対戦結果（観戦フレーム列＋勝敗）＝所有 state の投影。未デプロイ／未セッションは null。 */
export const battleRun = derived(sessionStore, (session): BattleRun | null => {
  if (session.stage === null || session.deployedImage === null) return null;
  return recordRun(session.stage.initial, session.deployedImage, session.stage.enemy);
});

/** ally（デプロイ済み）の擬似コード行＝ProgramViewer に渡す View Model。 */
export const allyLines = derived(sessionStore, (session): FlatLine[] => flatLines(session.deployedImage ?? []));

/** enemy（ステージ固定）の擬似コード行。 */
export const enemyLines = derived(sessionStore, (session): FlatLine[] => flatLines(session.stage?.enemy ?? []));

/** ally の行動ログ（全長）＝ActionLogViewer に渡す View Model。run 前は空。 */
export const allyLog = derived([battleRun, sessionStore], ([run, session]): ActionLogRow[] =>
  buildActionLog(run?.frames ?? [], session.deployedImage ?? [], "ally"),
);

/** enemy の行動ログ（全長）。run 前は空。 */
export const enemyLog = derived([battleRun, sessionStore], ([run, session]): ActionLogRow[] =>
  buildActionLog(run?.frames ?? [], session.stage?.enemy ?? [], "enemy"),
);

/** ally（デプロイ済み）イメージの指紋。未デプロイは null。 */
export const deployedHash = derived(sessionStore, (session): string | null =>
  session.deployedImage === null ? null : hashProgram(session.deployedImage),
);

/** enemy（ステージ固定）イメージの指紋。未セッションは null。 */
export const enemyHash = derived(sessionStore, (session): string | null =>
  session.stage === null ? null : hashProgram(session.stage.enemy),
);
