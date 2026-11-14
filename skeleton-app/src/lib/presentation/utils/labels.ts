import type { AutomatonId, BaseImage, BattleState, CommandName, ControlName, SensorName } from "#lib/application";

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
    case "brittleAttack":
      return "攻撃する（脆弱性あり）";
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

/** エポック時刻を HH:MM のローカル表記に整形する（ビルド／プッシュ時刻の版ラベル。復元点の目印）。 */
export const hhmm = (ts: number): string =>
  new Date(ts).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

/** 勝敗を A面の表示文に変換する（盤面バッジと結果サマリで共有）。 */
export const winnerText = (winner: BattleState["winner"]): string => {
  if (winner === "ally") return "ステージクリア！";
  if (winner === "enemy") return "負け...";
  if (winner === "draw") return "引き分け";
  return "";
};

/**
 * 版の表示ラベル（v版）。例: "v1.0"。
 * version は数値表記（"1.0"）で持ち、表示上の "v" 接頭辞はここに一元化する（版タイル・タグ双方の単一経路）。
 */
export const versionTag = (base: BaseImage): string => `v${base.version}`;

/** 素質（ベースイメージ）の A面表示タグ（imageName:v版）。例: "turtlogo:v1.0"。 */
export const baseImageTag = (base: BaseImage): string => `${base.imageName}:${versionTag(base)}`;
