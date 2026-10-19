---
description: テスト作成時の規約リマインド（Vitest unit + Playwright integration）
globs:
  - "skeleton-app/tests/**/*.ts"
  - "skeleton-app/src/**/*.test.ts"
---

# テスト規約

本PJのテスト構成は Vitest（unit）+ Playwright（integration）。

## リマインド

- **配置**:
  - Unit（Vitest）→ 対象コードと同階層か `src/` 配下に `*.test.ts`
  - Integration / E2E（Playwright）→ `tests/` 配下に `*.ts`（`playwright.config.ts` の `testDir: "tests"`）
- **実行**: `npm run test:unit`（vitest）/ `npm run test:integration`（playwright）/ `npm test`（両方）
- **過剰テストを避ける**: 実装の裏返しテストはせず、境界値と代表的な正常系に絞る
- **ゲームロジック**: 迷路進行・コマンド実行（`labyrinth` / `executer`）のコアロジックは Unit で、画面遷移・操作フローは Integration で検証する
