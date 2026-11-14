/**
 * 行動ログの読みモデル（観戦の派生）。
 *
 * 観戦フレーム列（対戦の実行結果＝動的）を、指定オートマトンが実行したコマンドの列に畳む。
 * active ノード id → コマンド名の解決に nodeIdMap（ドメイン）を使い、その依存を app 層に閉じる
 * ＝描画部品は Program でも nodeIdMap でもなく、この View Model（行）を受け取る dumb view になる。
 */

import { nodeIdMap } from "#lib/domain";
import type { AutomatonId, BattleState, CommandName, Program } from "#lib/domain";

/** 行動ログの1行。ラベル・擬似コードへの整形はプレゼンに委ね、ここは生のコマンド名まで。 */
export interface ActionLogRow {
  // このコマンドが実行されたフレーム位置。再生位置（frameIndex）での prefix 表示判定に使う。
  readonly frame: number;
  readonly clock: number;
  readonly cmd: CommandName;
}

/**
 * 観戦フレーム列を指定オートマトンの行動ログ（全長）に畳む。
 * frameIndex による prefix 表示は再生位置を持つ呼び出し側に委ねるため、ここでは全フレームを畳む。
 */
export function buildActionLog(frames: readonly BattleState[], program: Program, id: AutomatonId): ActionLogRow[] {
  // ノード id → コマンド名の索引（call ノードのみ。active は常に call ノードを指す）。
  const cmdByNode: (CommandName | undefined)[] = [];
  for (const [stmt, nid] of nodeIdMap(program)) {
    if (stmt.kind === "call") cmdByNode[nid] = stmt.cmd;
  }

  // 先頭（初期状態）を除く各フレームで、active ノードが指すコマンドを1行に起こす。
  // プログラム終了後（active なし）のフレームは記録しない。
  const rows: ActionLogRow[] = [];
  for (let i = 1; i < frames.length; i++) {
    const frame = frames[i];
    const nid = frame.active?.[id];
    const cmd = nid !== undefined ? cmdByNode[nid] : undefined;
    if (cmd) rows.push({ frame: i, clock: frame.clock, cmd });
  }
  return rows;
}
