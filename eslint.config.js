import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import reactCompiler from "eslint-plugin-react-compiler";
import eslintReact from "@eslint-react/eslint-plugin";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import sonarjs from "eslint-plugin-sonarjs";

export default tseslint.config(
  { ignores: ["dist", ".agents"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      eslintReact.configs["recommended-typescript"],
      sonarjs.configs.recommended,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "react-compiler": reactCompiler,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react-compiler/react-compiler": "error",

      // Custom React rule overrides
      "@eslint-react/no-missing-key": "error",
      "@eslint-react/no-array-index-key": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    extends: [js.configs.recommended],
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
    },
  },
  eslintConfigPrettier,
);
