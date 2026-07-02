import { lazy } from "react";
import { makePreloadable } from "./utils/preloadable";

export const loadCaseStudies = makePreloadable(
  () => import("./components/CaseStudies"),
);
export const loadSkills = makePreloadable(() => import("./components/Skills"));
export const loadProcessLibrary = makePreloadable(
  () => import("./components/ProcessLibrary"),
);
export const loadJournal = makePreloadable(
  () => import("./components/Journal"),
);
export const loadPdfViewerModal = makePreloadable(
  () => import("./components/PdfViewerModal"),
);
export const loadBpmnOverlay = makePreloadable(
  () => import("./components/BpmnOverlay"),
);

export const CaseStudies = lazy(loadCaseStudies.load);
export const Skills = lazy(loadSkills.load);
export const ProcessLibrary = lazy(loadProcessLibrary.load);
export const Journal = lazy(loadJournal.load);
export const PdfViewerModal = lazy(loadPdfViewerModal.load);
export const BpmnOverlay = lazy(loadBpmnOverlay.load);
