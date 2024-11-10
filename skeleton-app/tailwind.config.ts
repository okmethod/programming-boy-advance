import { join } from "path";
import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import { skeleton } from "@skeletonlabs/tw-plugin";
import { CustomTheme } from "./src/custom-theme";

export default {
  darkMode: "class",
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    join(require.resolve("@skeletonlabs/skeleton"), "../**/*.{html,js,svelte,ts}"),
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel10: ["PixelMplus10", "sans-serif"],
        pixel12: ["PixelMplus12", "sans-serif"],
      },
    },
  },
  plugins: [
    forms,
    typography,
    skeleton({
      themes: {
        custom: [CustomTheme],
      },
    }),
  ],
} satisfies Config;
