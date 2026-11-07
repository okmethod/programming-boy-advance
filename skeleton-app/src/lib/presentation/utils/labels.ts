import type { AutomatonId, BattleState, CommandName, ControlName, SensorName } from "$lib/domain";

/** コマンド（命令）の A面表示ラベル（実行ログなどで使う。ブロックの見た目と揃える）。 */
export const commandLabel = (cmd: CommandName): string => {
  switch (cmd) {
    case "stepForward":
      return "前に進む";
    case "turnRight":
      return "右を向く";
    case "turnLeft":
      return "左を向く";
    case "attack":
      return "攻撃する";
    case "loadAttack":
      return "負荷攻撃する";
    case "wait":
      return "待機する";
  }
};

/** クエリ（センサ）の A面表示ラベル（素質が解放する「調べる力」。ブロックの見た目と揃える）。 */
export const sensorLabel = (sensor: SensorName): string => {
  switch (sensor) {
    case "wallAhead":
      return "壁が前にある";
    case "enemyAhead":
      return "敵が前にいる";
  }
};

/** 制御構文の A面表示ラベル（素質が解放する「組み立ての力」。ブロックの見た目と揃える）。 */
export const controlLabel = (control: ControlName): string => {
  switch (control) {
    case "if":
      return "もし〜なら";
    case "repeat":
      return "くりかえす";
    case "while":
      return "〜のあいだ";
  }
};

/** オートマトンの陣営・状態を表す mdi アイコン名（盤面・ステータスで共有）。HP0 は撃破顔に切替える。 */
export const automatonIcon = (id: AutomatonId, defeated = false): string => {
  if (id === "ally") return defeated ? "mdi:robot-dead-outline" : "mdi:robot-outline";
  return defeated ? "mdi:robot-dead" : "mdi:robot-angry";
};

/** オートマトンの陣営名（ステータス見出し用の短いラベル）。 */
export const automatonName = (id: AutomatonId): string => (id === "ally" ? "Ally" : "Enemy");

/** 勝敗を A面の表示文に変換する（盤面バッジと結果サマリで共有）。 */
export const winnerText = (winner: BattleState["winner"]): string => {
  if (winner === "ally") return "自キャラの勝ち";
  if (winner === "enemy") return "敵キャラの勝ち";
  if (winner === "draw") return "引き分け";
  return "";
};
