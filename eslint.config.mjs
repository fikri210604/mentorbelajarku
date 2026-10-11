import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/incompatible-library": "warn",
      "react/no-unescaped-entities": "off",
      "prefer-const": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // E2E tests are not part of the app build. Playwright compiles them itself
    // and they lean on `any` inside page.evaluate, which is idiomatic there.
    "tests/**",
    // Playwright output artifacts.
    "playwright-report/**",
    "test-results/**",
    // Local agent/tooling directories (not part of the app).
    ".opencode/**",
    ".agents/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;
