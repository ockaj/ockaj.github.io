import { memo } from "react";
import Aurora from "./Aurora.tsx";
import { ErrorBoundary } from "./ErrorBoundary";

const AURORA_COLOR_STOPS = ["#1E1B4B", "#312E81", "#6667AB", "#A78BFA"];

function BackgroundAurora() {
  return (
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0">
      <div style={{ height: "100%", width: "100%", position: "relative" }}>
        <ErrorBoundary
          fallback={
            <div className="absolute inset-0 bg-gradient-to-b from-[#1E1B4B] to-[#0a0a0a]" />
          }
        >
          <Aurora
            colorStops={AURORA_COLOR_STOPS}
            speed={1.0}
            amplitude={1.0}
            blend={0.65}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default memo(BackgroundAurora);
