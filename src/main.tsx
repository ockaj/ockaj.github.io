import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./bones/registry";
import { configureBoneyard } from "boneyard-js/react";
import { applyDomTranslatePatch } from "./utils/domTranslatePatch";

applyDomTranslatePatch();

configureBoneyard({
  color: "rgba(255, 255, 255, 0.015)",
  darkColor: "rgba(255, 255, 255, 0.015)",
  animate: "shimmer",
  shimmerColor: "rgba(255, 255, 255, 0.08)",
  darkShimmerColor: "rgba(255, 255, 255, 0.08)",
  speed: "2s",
  shimmerAngle: 110,
  stagger: 80,
  transition: 300,
  select: "viewport",
});

if (import.meta.env.DEV) {
  import("./utils/performanceLogger").then(({ initPerformanceLogging }) => {
    initPerformanceLogging();
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
