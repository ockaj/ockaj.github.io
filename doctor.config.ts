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
          "src/components/Bpmn/BpmnDiagram.tsx",
          "src/components/LoadingScreen/LoadingBpmnDiagram.tsx",
          "src/components/PdfViewerModal/InteractiveCvView.tsx",
        ],
        rules: ["react-doctor/no-giant-component"],
      },
    ],
  },
});
