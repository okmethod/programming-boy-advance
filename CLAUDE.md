# CLAUDE.md

---

## 行動原則

- **回答は日本語で簡潔に行う**
- **コミット前に必ず lint/format を実行する**
- **サブエージェントを積極活用しトークン節約する**:
  - 3ファイル以上の調査・コード検索 → Explore
  - 実装計画の策定 → Plan
  - テスト/Lint/ビルド実行 → Bash (background可)

---

## プロジェクト概要

ブロックを組んで自律キャラを戦わせるプログラミング学習ゲーム

> **コンセプト・スコープ・設計の最新断面は [`docs/`](docs/README.md) を正とする**（`docs/game-rules/`=何を作るか / `docs/design/`=どう作るか）。

- **リポジトリ**: https://github.com/okmethod/programming-boy-advance
- **公開**: GitHub Pages https://okmethod.github.io/programming-boy-advance/
- **技術スタック**: TypeScript 6, Skeleton v5 (Svelte 5 Runes + TailwindCSS v4 + Vite 8), SvelteKit 3, Node 20
  - 依存・コードの Svelte 5 移行は完了（build / check / lint / test green、dev で全ルート動作）。**新規コードは Runes 前提で書く**（`.claude/rules/svelte-guide.md`）
  - **残課題**: ゲームボーイ配色の忠実移植（現状は stock テーマ `vintage` で起動）

## ディレクトリ

- `skeleton-app/`: Skeleton フロントエンド（リポジトリ直下の単一アプリ）
  - `src/routes/`: 画面（`books` / `labyrinth` / `executer`）
  - `src/lib/components/`: コンポーネント
  - `src/lib/stores/`: ストア
  - `src/lib/types/`: 型定義
  - `src/lib/utils/`: ユーティリティ
  - `src/lib/constants/`: 定数
- `.claude/rules/`: コーディング規約（言語非依存 + TS/Svelte/テスト固有）
- `docs/`: 設計ドキュメント（最新断面）。`design/`=アーキテクチャ・実行モデル等、`game-rules/`=ゲームの世界・ユビキタス言語

---

## 開発ワークフロー

- **ローカル / 1 人作業**: `main` に直接コミットして進めてよい
- **Svelte 5 移行作業**: `main` で段階コミットしながら進める。見た目破壊は一旦許容し「動く」ことを優先（`CLAUDE_SETUP_PLAN.md` §4）
- **コミットメッセージ**: gitmoji 規約（例: `:up:` `:gear:` `:memo:`）
- **設計判断の記録**: 現在の設計断面は `docs/`（ADR は作らない）、判断の履歴は git log / コミットメッセージ、細部はコード内の inline Why に残す
