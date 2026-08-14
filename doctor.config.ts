import { defineConfig } from "react-doctor/api";

export default defineConfig({
  ignore: {
    rules: [
      "react-doctor/use-lazy-motion",
      "react-doctor/react-compiler-no-manual-memoization",
    ],
    overrides: [
      {
        files: [
          "src/components/BpmnDiagram.tsx",
          "src/components/LoadingScreen/LoadingBpmnDiagram.tsx",
          "src/components/PdfViewerModal/InteractiveCvView.tsx",
        ],
        rules: ["react-doctor/no-giant-component"],
      },
      {
        files: ["src/hooks/usePreloadComponents.ts"],
        rules: ["react-doctor/async-await-in-loop"],
      },
    ],
  },
});
