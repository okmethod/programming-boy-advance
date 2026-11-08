import prettier from "eslint-config-prettier";
import js from "@eslint/js";
import { includeIgnoreFile } from "@eslint/compat";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import { fileURLToPath } from "node:url";
import ts from "typescript-eslint";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

// SvelteKit v3 で svelte.config.js が廃止されたため、eslint-plugin-svelte 用に最小構成を定義
const svelteConfig = { preprocess: vitePreprocess() };

const gitignorePath = fileURLToPath(new URL("./.gitignore", import.meta.url));

export default ts.config(
  includeIgnoreFile(gitignorePath),
  {
    ignores: [".svelte-kit/**"],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: fileURLToPath(new URL(".", import.meta.url)),
        extraFileExtensions: [".svelte"],
        parser: ts.parser,
        svelteConfig,
      },
    },
  },
  // レイヤー間依存ルールの機械的強制（各バレルの @architecture コメントと対。詳細は docs/design/architecture.md）
  // プレゼン層（src/lib/presentation・src/routes）はアプリ層バレル（$lib/application）のみを窓口にする。
  {
    files: ["src/lib/presentation/**", "src/routes/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["$lib/domain", "$lib/domain/**"],
              message:
                "プレゼン層はドメイン層を直接 import しない。型/定数は $lib/application 経由（アプリ層バレルが単一窓口）。",
            },
            {
              group: ["$lib/infrastructure", "$lib/infrastructure/**"],
              message: "プレゼン層はインフラ層を直接 import しない。合成ルート（composition.ts）に限る。",
            },
          ],
        },
      ],
    },
  },
  // 例外: 合成ルートだけはインフラ層の具体 Adapter を直接 import してよい（ドメイン層直 import は引き続き禁止）。
  {
    files: ["src/lib/presentation/composition.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["$lib/domain", "$lib/domain/**"],
              message:
                "プレゼン層はドメイン層を直接 import しない。型/定数は $lib/application 経由（アプリ層バレルが単一窓口）。",
            },
          ],
        },
      ],
    },
  },
);
