import { defineConfig, globalIgnores } from "eslint/config";
import prettierConfig from "eslint-config-prettier";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".data/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage",
  ]),
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],
      eqeqeq: "error",
      "func-style": [
        "error",
        "declaration",
        {
          allowArrowFunctions: false,
        },
      ],
      "max-lines": [
        "error",
        {
          max: 600,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      "prefer-const": "error",
    },
  },
  prettierConfig,
]);

export default eslintConfig;
