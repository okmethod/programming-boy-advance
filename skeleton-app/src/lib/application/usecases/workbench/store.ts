/**
 * ワークベンチ（編集中のドラフト）の状態＝唯一の真実。
 *
 * レジストリ（保管済みイメージ）とは別概念＝「いま編集している1つのドラフト」。
 * エディタに例えると registry=保存済みファイル／ここ=開いている未保存ドキュメント。
 * 画面（サンドボックス⇄プレイ面）を跨いでも編集を失わないよう、route ローカルの $state ではなく
 * アプリ層の module singleton で持つ（寿命＝アプリセッション）。永続化はしない（リロードでは消える）。
 *
 * registry の store.ts に準拠した CQRS 分離：
 * - 読み：readonly 投影（workbenchDraft）を UI が直接 `$`購読する（Facade を介さなくてよい）。
 * - 書き：storeWriter は「値をどう保持し、どう差し替えるか」だけに責務を絞った機械的な単一経路で、
 *   UI には公開せず facade からのみ呼ぶ。意味のある操作（build/pull 等）は facade 側に置く。
 *
 * SSR/プリレンダ時はユーザ操作が無く書き込みが起きないため、singleton でもリクエスト跨ぎの
 * 汚染は起きない（初期ドラフトのまま）。
 */

import { get, readonly, writable } from "svelte/store";
import type { BaseImage, Program } from "$lib/domain";
import { DEFAULT_BASE_IMAGE } from "$lib/domain";

/** 編集中のドラフト断面。program＝Blockly からの最新、builtImage＝ビルドで凍結した断面。 */
export interface WorkbenchDraft {
  // 編集中プログラム（Blockly を SSoT とする順方向の断面）。
  readonly program: Program;
  // ビルドで凍結したイメージ（試運転／デプロイ／プッシュの対象）。未ビルドは null。
  readonly builtImage: Program | null;
  // 最終ビルド時刻（復元点の目印）。未ビルドは null。
  readonly builtAt: number | null;
  // カレントイメージのローカル名（push 前から付けられる）。
  readonly imageName: string;
  // 編集の土台にする素質（系統×版）。パレットに出せるブロックを決める。
  readonly baseImage: BaseImage;
}

const INITIAL_DRAFT: WorkbenchDraft = {
  program: [],
  builtImage: null,
  builtAt: null,
  imageName: "",
  baseImage: DEFAULT_BASE_IMAGE,
};

// 内部の可変ドラフト。writable を外に晒さず、読みは readonly、書きは storeWriter 経由に限る。
const draftStore = writable<WorkbenchDraft>(INITIAL_DRAFT);

/** 編集中ドラフト（readonly）。コンポーネントはこの readonly store を `$`購読する。 */
export const workbenchDraft = readonly(draftStore);

/**
 * ドラフトへの機械的な書き込み口（facade からのみ呼ぶ・UI には公開しない）。
 * 単一レコードなので、集合版 registry の add/replace とは異なり update/snapshot が機械的プリミティブ。
 */
export const storeWriter = {
  /** 現在のドラフトを updater で差し替える（書き込みの単一経路）。 */
  update(updater: (draft: WorkbenchDraft) => WorkbenchDraft): void {
    draftStore.update(updater);
  },
  /** 現在のドラフトのスナップショット（非追跡の一発読み）。 */
  snapshot(): WorkbenchDraft {
    return get(draftStore);
  },
};
