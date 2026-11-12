/**
 * ステージ状態 → file 系アイコンの写像（状態×選択の 2 軸セレクタ）。
 *
 * 本(章)→ページ(ステージ)のメタファーに沿え、章は book、ステージは file 系で表す。
 * locked/cleared は進行モデル導入時の拡張口として表だけ先に用意する
 * （現状は全ステージ "open" が流れる＝アンロック/クリアの材料がまだ無い）。
 */

/** ステージの進行状態（表示用）。 */
export type StageStatus = "locked" | "open" | "cleared";

// 状態×選択 → mdi アイコン名。locked は選択不可のため selected 分岐を持たない。
export function stageIcon(status: StageStatus, selected: boolean): string {
  switch (status) {
    case "locked":
      return "mdi:file-lock-outline";
    case "open":
      return selected ? "mdi:file" : "mdi:file-outline";
    case "cleared":
      return selected ? "mdi:file-check" : "mdi:file-check-outline";
  }
}
