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

コードを書いて迷路を進むプログラミング学習ゲーム

- **リポジトリ**: https://github.com/okmethod/programming-boy-advance
- **公開**: GitHub Pages https://okmethod.github.io/programming-boy-advance/
- **技術スタック（現行）**: TypeScript 5.6, Skeleton v2 (Svelte 4 + TailwindCSS v3 + Vite 5), SvelteKit 2, Node 20
  - **【移行中】** Svelte 5 (Runes) / Skeleton v5 / TailwindCSS v4 / Vite 8 / TS 6 への移行が未完了。
    移行トラックは `CLAUDE_SETUP_PLAN.md` §4 を参照。**新規コードは Runes 前提で書く**（`.claude/rules/svelte-guide.md`）

## ディレクトリ

- `skeleton-app/`: Skeleton フロントエンド（リポジトリ直下の単一アプリ）
  - `src/routes/`: 画面（`books` / `labyrinth` / `executer`）
  - `src/lib/components/`: コンポーネント
  - `src/lib/stores/`: ストア
  - `src/lib/types/`: 型定義
  - `src/lib/utils/`: ユーティリティ
  - `src/lib/constants/`: 定数
- `.claude/rules/`: コーディング規約（言語非依存 + TS/Svelte/テスト固有）

---

## 開発ワークフロー

- **ローカル / 1 人作業**: `main` に直接コミットして進めてよい
- **Svelte 5 移行作業**: 破壊的変更が大きいため、別ブランチ・段階コミットで進める（`CLAUDE_SETUP_PLAN.md` §4）
- **コミットメッセージ**: gitmoji 規約（例: `:up:` `:gear:` `:memo:`）
- **設計判断の記録**: git log / コミットメッセージ、およびコード内の inline Why に残す（ADR は作らない）
