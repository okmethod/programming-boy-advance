import type { BattleState } from "$lib/domain";

/** 勝敗を A面の表示文に変換する（盤面バッジと結果サマリで共有）。 */
export function winnerText(winner: BattleState["winner"]): string {
  if (winner === "ally") return "🤖 自キャラの勝ち";
  if (winner === "enemy") return "👾 敵キャラの勝ち";
  if (winner === "draw") return "引き分け";
  return "";
}
