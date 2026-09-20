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

export const boundaryConfigs = [
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: featureBoundaryPatterns,
        },
      ],
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
];
