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

- **リポジトリ**: https://github.com/okmethod/programming-boy-advance
- **コンセプトとスコープ**: ゲームプレイを通じて、開発フローのメンタルモデルを得られる（`docs/README.md`）
- **ユビキタス言語**: ゲームの世界観に沿った命名（A面・B面）を常に意識すること（`docs/game-rules/overview.md`）
- **アーキテクチャ**: 4 層 Clean Architecture - レイヤー境界を常に意識すること（`docs/design/architecture.md`）
- **技術スタック**: TypeScript 6, Skeleton v5 (Svelte 5 Runes + TailwindCSS v4 + Vite 8), SvelteKit 3, Node 26

## ディレクトリ

- `docs`: ドキュメント全体像 + コンセプト + スコープ方針
  - `docs/game-rules/`: ゲームルール・世界観・ユビキタス言語・等
  - `docs/design/`: アーキテクチャ・実行モデル・等
- `skeleton-app/`: Skeleton フロントエンド
  - `src/lib/domain/`: ドメイン層
  - `src/lib/application/`: アプリ層
  - `src/lib/infrastructure/`: インフラ層
  - `src/lib/presentation/`: プレゼン層
  - `src/routes/`: 画面
- `.claude/rules/`: コーディング規約（言語非依存 + TS/Svelte/テスト固有）

---

## 開発ワークフロー

- **ローカル / 1 人作業**: `main` に直接コミットして進めてよい
- **コミットメッセージ**: gitmoji 規約（例: `:up:` `:gear:` `:memo:`）
- **設計判断の記録**: 現在の設計断面は `docs/`（ADR は作らない）、判断の履歴は git log / コミットメッセージ、細部はコード内の inline Why に残す
