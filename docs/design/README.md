# 設計方針

このアプリを **どう作るか**（技術的な設計・実装方針）を記述する。  
ゲームのルール（何を作るか）は [game-rules/](../game-rules/) に置き、ここでは再説明せずリンクで誘導する。

このディレクトリは [game-rules/](../game-rules/) に依存してよい（逆向きは禁止）。

---

## 📄 ファイル一覧

- [architecture.md](./architecture.md) — アーキテクチャ全体像（4層クリーンアーキテクチャ・依存方向・データフロー・各層の責務）
- [execution-model.md](./execution-model.md) — プログラム実行モデル（命令木 ＋ 再開可能インタプリタ ＋ ロックステップ ＋ 決定性）。最も後戻りコストの大きい中核決定

> ストア機構（Runes / Svelte Store）やコンテンツ定義方式（TS/JSON / YAML+DSL）は後から移行可能なため、実装着手時に確定する。

---

## 📖 読む順序

1. まず [architecture.md](./architecture.md) でレイヤー構成と依存方向を把握する
2. 次に [execution-model.md](./execution-model.md) で中核（プログラムをどう実行するか）を把握する
