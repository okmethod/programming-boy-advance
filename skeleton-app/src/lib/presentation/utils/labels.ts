import type { AutomatonId, BattleState } from "$lib/domain";

/** オートマトンの陣営・状態を表す mdi アイコン名（盤面・ステータスで共有）。HP0 は撃破顔に切替える。 */
export function automatonIcon(id: AutomatonId, defeated = false): string {
  if (id === "ally") return defeated ? "mdi:robot-dead-outline" : "mdi:robot-outline";
  return defeated ? "mdi:robot-dead" : "mdi:robot-angry";
}

/** オートマトンの陣営名（ステータス見出し用の短いラベル）。 */
export function automatonName(id: AutomatonId): string {
  return id === "ally" ? "Ally" : "Enemy";
}

/** 勝敗を A面の表示文に変換する（盤面バッジと結果サマリで共有）。 */
export function winnerText(winner: BattleState["winner"]): string {
  if (winner === "ally") return "自キャラの勝ち";
  if (winner === "enemy") return "敵キャラの勝ち";
  if (winner === "draw") return "引き分け";
  return "";
}
