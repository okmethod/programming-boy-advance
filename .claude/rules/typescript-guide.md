---
description: TypeScript の開発規約（命名・readonly・JSDoc/コメント方針）。全PJ共通の核
globs:
  - "skeleton-app/**/*.ts"
---

# TypeScript

> このファイルは全PJ共通の核（SSoT: `okmethod/.claude/rules/`）。言語非依存の規約は `coding-guide.md` が原典。
> 本PJでは globs と「よく使うコマンド」節を上書きしている。

## 開発規約

- ドメインモデルの型フィールドは `readonly` を基本とする（不変性の保証）
- JSDoc は **1 行要約** を基本とし、型と重複する情報は書かない
  - 自明な `@param` / `@returns` は省く（引数名と型で十分なら不要）
  - `@type` タグは使わない（TS の型定義が SSoT）
- 根幹部分（インターフェース・基底クラス・公開 API・`index.ts`）には JSDoc を書く
- 枝葉部分（個別実装・private メソッド・メソッド内処理）は `//` コメントのみ（JSDoc は書かない）

## よく使うコマンド

本PJのコードは `skeleton-app/` 配下にある。

```bash
(cd skeleton-app && npm run lint)             # prettier check + eslint
(cd skeleton-app && npm run format)           # prettier write
(cd skeleton-app && npm run check)            # svelte-check --tsconfig
(cd skeleton-app && npm run test:unit)        # vitest
(cd skeleton-app && npm run test:integration) # playwright
```
