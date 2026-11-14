import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import fs from "fs";
import path from "path";

const githubRepoName = "programming-boy-advance";

export default defineConfig({
  // base と publicDir は SvelteKit が管理する（paths.base / static ディレクトリ）
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        pure_funcs: ["console.debug"], // console.debug を無効化
      },
    },
  },
  plugins: [
    tailwindcss(),
    // SvelteKit v3 から設定は svelte.config.js ではなく sveltekit() に渡す
    sveltekit({
      // Consult https://svelte.dev/docs/kit/integrations
      // for more information about preprocessors
      preprocess: vitePreprocess(),
      // SvelteKit v3 で $lib は廃止。package.json の subpath imports (#lib/*) に移行済み
      appDir: "app",
      adapter: adapter({
        pages: "build",
        assets: "build",
        fallback: "index.html",
        precompress: false,
        strict: true,
      }),
      paths: {
        // Github Pagesで公開する場合は、base にリポジトリ名を指定
        base: `/${githubRepoName}`,
      },
    }),
    {
      name: "log-version",
      closeBundle() {
        const versionFilePath = path.resolve(import.meta.dirname, "build/app/version.json");
        if (fs.existsSync(versionFilePath)) {
          const versionContent = fs.readFileSync(versionFilePath, "utf-8");
          console.log("version.json:", versionContent);
        } else {
          console.log("version.json not found");
        }
      },
    },
  ],
});
