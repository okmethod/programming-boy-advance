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

## コンポーネントテストの射程

- **原則、コンポーネント（`.svelte`）単体テストは書かない**。ロジックは純関数（`lib/` 側）に剥がして **Unit**、通し・描画・実操作は **Integration/E2E** に寄せる（＝薄いコンポーネント＋純関数＋E2E。姉妹PJ踏襲）
- 「状態→表示」「操作→イベント」の配線・境界バグ（例: HP→バー幅の丸め、ハイライトのオフバイワン、終端で step 無効）の多くは、その写像を**純関数化すれば Unit で拾える**。まず剥がして段1で守る
- **例外**: 純関数に剥がせないロジックを持つ複雑部品（例: 実行ハイライトが Blockly 描画と密結合）× 目視/E2E では捕まえにくい × 回帰を繰り返す、が揃った時だけ、その1部品に限り `@testing-library/svelte` + `happy-dom`（Blockly/canvas は Vitest browser mode）を局所導入する
