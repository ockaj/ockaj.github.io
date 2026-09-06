import { lazy } from "react";

export const CaseStudies = lazy(
  () => import("./components/CaseStudies/CaseStudies.tsx"),
);
export const Skills = lazy(() => import("./components/Skills.tsx"));
export const ProcessLibrary = lazy(
  () => import("./components/ProcessLibrary.tsx"),
);
export const Journal = lazy(() => import("./components/Journal/Journal.tsx"));
export const Faq = lazy(() => import("./components/Faq/Faq.tsx"));
export const loadPdfViewerModal = () =>
  import("./components/PdfViewerModal.tsx");
export const PdfViewerModal = lazy(loadPdfViewerModal);
export const BpmnOverlay = lazy(() => import("./components/BpmnOverlay.tsx"));
