import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import reactCompiler from "eslint-plugin-react-compiler";
import eslintReact from "@eslint-react/eslint-plugin";
import reactGoogleTranslate from "eslint-plugin-react-google-translate";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import sonarjs from "eslint-plugin-sonarjs";

const featureBoundaryPatterns = [
  {
    regex: "(?:^|[./])CaseStudies/(?!CaseStudies(?:\\.tsx?)?$)",
    message:
      "Deep Module Violation: Private child components of CaseStudies cannot be imported from outside. Import only from CaseStudies/CaseStudies. See .agents/rules/component-imports.md.",
  },
  {
    regex: "(?:^|[./])Journal/(?!Journal(?:\\.tsx?)?$)",
    message:
      "Deep Module Violation: Private child components of Journal cannot be imported from outside. Import only from Journal/Journal. See .agents/rules/component-imports.md.",
  },
  {
    regex: "(?:^|[./])ProcessLibrary/(?!ProcessLibrary(?:\\.tsx?)?$)",
    message:
      "Deep Module Violation: Private child components of ProcessLibrary cannot be imported from outside. Import only from ProcessLibrary/ProcessLibrary. See .agents/rules/component-imports.md.",
  },
  {
    regex: "(?:^|[./])ProcessLightbox/(?!ProcessLightbox(?:\\.tsx?)?$)",
    message:
      "Deep Module Violation: Private child components of ProcessLightbox cannot be imported from outside. Import only from ProcessLightbox/ProcessLightbox. See .agents/rules/component-imports.md.",
  },
  {
    regex: "(?:^|[./])Faq/(?!Faq(?:\\.tsx?)?$)",
    message:
      "Deep Module Violation: Private child components of Faq cannot be imported from outside. Import only from Faq/Faq. See .agents/rules/component-imports.md.",
  },
  {
    regex: "(?:^|[./])Aurora/(?!Aurora(?:\\.tsx?)?$)",
    message:
      "Deep Module Violation: Private child components of Aurora cannot be imported from outside. Import only from Aurora/Aurora. See .agents/rules/component-imports.md.",
  },
  {
    regex: "(?:^|[./])LoadingScreen/(?!LoadingScreen(?:\\.tsx?)?$)",
    message:
      "Deep Module Violation: Private child components of LoadingScreen cannot be imported from outside. Import only from LoadingScreen/LoadingScreen. See .agents/rules/component-imports.md.",
  },
  {
    regex: "(?:^|[./])Navigation/(?!Navbar(?:\\.tsx?)?$)",
    message:
      "Deep Module Violation: Private child components of Navigation cannot be imported from outside. Import only from Navigation/Navbar. See .agents/rules/component-imports.md.",
  },
  {
    regex: "(?:^|[./])PdfViewerModal/(?!PdfViewerModal(?:\\.tsx?)?$)",
    message:
      "Deep Module Violation: Private child components of PdfViewerModal cannot be imported from outside. Import only from PdfViewerModal/PdfViewerModal. See .agents/rules/component-imports.md.",
  },
  {
    regex: "(?:^|[./])Bpmn/(?!(?:BpmnOverlay|BpmnNodeBadge)(?:\\.tsx?)?$)",
    message:
      "Deep Module Violation: Private child components of Bpmn cannot be imported from outside. Import only from Bpmn/BpmnOverlay or Bpmn/BpmnNodeBadge. See .agents/rules/component-imports.md.",
  },
  {
    regex:
      "(?:^|[./])LiquidGlass/(?!(?:LiquidGlass|LiquidGlassTabs|types)(?:\\.tsx?)?$)",
    message:
      "Deep Module Violation: Private child components of LiquidGlass cannot be imported from outside. Import only from LiquidGlass/LiquidGlass, LiquidGlass/LiquidGlassTabs, or LiquidGlass/types. See .agents/rules/component-imports.md.",
  },
];

export default tseslint.config(
  { ignores: ["dist", ".agents", "portfolio-agent-configs"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      eslintReact.configs["recommended-typescript"],
      sonarjs.configs.recommended,
      reactGoogleTranslate.configs.recommended,
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

      // Architectural feature boundary enforcement
      "no-restricted-imports": [
        "error",
        {
          patterns: featureBoundaryPatterns,
        },
      ],

      // Custom React rule overrides
      "@eslint-react/no-missing-key": "error",
      "@eslint-react/no-array-index-key": "warn",

      // Unused vars: allow leading underscore and ignore rest siblings
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "sonarjs/no-unused-vars": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["src/utils/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...featureBoundaryPatterns,
            {
              regex: "(?:^|[./])(?:hooks|store|components)/",
              message:
                "Tier 2 (utils) cannot import from Tier 3 (store, hooks) or Tier 4/5 (components).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/store/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...featureBoundaryPatterns,
            {
              regex: "(?:^|[./])components/",
              message:
                "Tier 3 (store, hooks) cannot import from Tier 4/5 (components).",
            },
          ],
        },
      ],
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
