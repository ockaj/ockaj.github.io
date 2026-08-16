/**
 * Development-only performance logging utility.
 *
 * Provides:
 * 1. Web Vitals Attribution (INP, CLS, LCP, FCP, TTFB) with rating badges and subpart timings.
 * 2. Long Animation Frame (LoAF) observer to pinpoint slow animation frames,
 *    invokers (requestAnimationFrame, observers, interactions), source locations, and forced reflows.
 */

import {
  onCLS,
  onFCP,
  onINP,
  onLCP,
  onTTFB,
  type MetricWithAttribution,
  type INPMetricWithAttribution,
  type CLSMetricWithAttribution,
  type LCPMetricWithAttribution,
  type FCPMetricWithAttribution,
  type TTFBMetricWithAttribution,
} from "web-vitals/attribution";

interface ScriptLogItem {
  invoker: string;
  invokerType: string;
  function: string;
  source: string;
  duration: string;
  forcedReflow: string;
}

interface FrameTimingSummary {
  frameDuration: string;
  blockingDuration: string;
  scriptDuration: string;
  renderDuration: string;
  styleAndLayoutDuration: string;
  uiEventBlocked: boolean;
  category:
    | "Animation (rAF)"
    | "Interaction"
    | "Observer"
    | "Forced Reflow"
    | "Style & Layout"
    | "Script Task";
  culprit: string;
}

const BADGE_STYLES: {
  readonly [key in "good" | "needs-improvement" | "poor"]: string;
} = {
  good: "background: #0cce6b; color: #000; font-weight: 700; border-radius: 3px; padding: 2px 6px; font-size: 11px;",
  "needs-improvement":
    "background: #ffa400; color: #000; font-weight: 700; border-radius: 3px; padding: 2px 6px; font-size: 11px;",
  poor: "background: #ff4e42; color: #fff; font-weight: 700; border-radius: 3px; padding: 2px 6px; font-size: 11px;",
};

const PREFIX_STYLE =
  "background: #1e293b; color: #94a3b8; font-weight: 600; border-radius: 3px; padding: 2px 5px; font-size: 11px;";
const LOAF_BADGE_STYLE =
  "background: #818cf8; color: #0f172a; font-weight: 700; border-radius: 3px; padding: 2px 6px; font-size: 11px;";
const CATEGORY_BADGE_STYLE =
  "background: #334155; color: #38bdf8; font-weight: 600; border-radius: 3px; padding: 2px 6px; font-size: 11px;";
const RESET_STYLE = "color: inherit; font-weight: normal;";

/**
 * Strips origin and query strings from source URLs for clean console logs.
 */
function cleanSourceUrl(url?: string, charPos?: number): string {
  if (!url) return "(inline/native)";
  try {
    const parsed = new URL(url, window.location.href);
    const path = parsed.pathname.replace(/^\/@fs\//, "").replace(/^\//, "");
    return charPos != null && charPos > 0 ? `${path}:${charPos}` : path;
  } catch {
    return url;
  }
}

/**
 * Formats a metric value with appropriate units.
 */
function formatMetricValue(name: string, value: number): string {
  if (name === "CLS") {
    return value.toFixed(4);
  }
  return `${Math.round(value)} ms`;
}

/**
 * Logs a Web Vital metric with styled console badges and diagnostic attribution.
 */
function logWebVital(metric: MetricWithAttribution): void {
  const badgeStyle = BADGE_STYLES[metric.rating] || BADGE_STYLES.good;
  const formattedVal = formatMetricValue(metric.name, metric.value);

  console.groupCollapsed(
    `%cWeb Vitals%c %c${metric.name}%c ${formattedVal} (${metric.rating})`,
    PREFIX_STYLE,
    RESET_STYLE,
    badgeStyle,
    RESET_STYLE,
  );

  switch (metric.name) {
    case "INP": {
      const inp = metric as INPMetricWithAttribution;
      const attr = inp.attribution;

      console.log("⏱️ Subparts Breakdown:", {
        "Input Delay": `${attr.inputDelay.toFixed(1)} ms`,
        "Processing Duration": `${attr.processingDuration.toFixed(1)} ms`,
        "Presentation Delay": `${attr.presentationDelay.toFixed(1)} ms`,
      });

      console.log("🎯 Interaction Context:", {
        Target: attr.interactionTarget || "(unknown target)",
        "Event Type": attr.interactionType || "(unknown type)",
        "Load State": attr.loadState,
      });

      if (attr.longestScript) {
        const script = attr.longestScript.entry;
        console.log("🎬 Longest Script Culprit:", {
          Invoker: script.invoker,
          "Invoker Type": script.invokerType,
          Function: script.sourceFunctionName || "(anonymous)",
          Source: cleanSourceUrl(script.sourceURL, script.sourceCharPosition),
          Subpart: attr.longestScript.subpart,
          "Intersecting Duration": `${attr.longestScript.intersectingDuration.toFixed(1)} ms`,
        });
      }

      if (attr.longAnimationFrameEntries?.length) {
        console.log(
          `📊 Intersecting Long Animation Frames (${attr.longAnimationFrameEntries.length}):`,
        );
        for (const loaf of attr.longAnimationFrameEntries) {
          logLoAFEntry(loaf, true);
        }
      }
      break;
    }

    case "CLS": {
      const cls = metric as CLSMetricWithAttribution;
      const attr = cls.attribution;

      console.log("📐 Layout Shift Diagnostics:", {
        "Largest Shift Value": attr.largestShiftValue?.toFixed(4),
        "Largest Shift Target": attr.largestShiftTarget || "(none)",
        "Shift Time":
          attr.largestShiftTime != null
            ? `${Math.round(attr.largestShiftTime)} ms`
            : "N/A",
        "Load State": attr.loadState,
      });

      if (attr.largestShiftSource?.node) {
        console.log("📍 Shifted DOM Node:", attr.largestShiftSource.node);
      }
      break;
    }

    case "LCP": {
      const lcp = metric as LCPMetricWithAttribution;
      const attr = lcp.attribution;

      console.log("🖼️ LCP Subparts Breakdown:", {
        TTFB: `${attr.timeToFirstByte.toFixed(1)} ms`,
        "Resource Load Delay": `${attr.resourceLoadDelay.toFixed(1)} ms`,
        "Resource Load Duration": `${attr.resourceLoadDuration.toFixed(1)} ms`,
        "Element Render Delay": `${attr.elementRenderDelay.toFixed(1)} ms`,
      });

      console.log("🎯 LCP Target:", {
        Element: attr.target || "(none)",
        URL: attr.url || "(text node or inline)",
      });
      break;
    }

    case "FCP": {
      const fcp = metric as FCPMetricWithAttribution;
      const attr = fcp.attribution;

      console.log("⚡ FCP Diagnostics:", {
        "Time To First Byte": `${attr.timeToFirstByte.toFixed(1)} ms`,
        "First Byte to FCP": `${attr.firstByteToFCP.toFixed(1)} ms`,
        "Load State": attr.loadState,
      });
      break;
    }

    case "TTFB": {
      const ttfb = metric as TTFBMetricWithAttribution;
      const attr = ttfb.attribution;

      console.log("🌐 TTFB Breakdown:", {
        "Waiting Duration": `${attr.waitingDuration.toFixed(1)} ms`,
        "DNS Duration": `${attr.dnsDuration.toFixed(1)} ms`,
        "Connection Duration": `${attr.connectionDuration.toFixed(1)} ms`,
        "Request Duration": `${attr.requestDuration.toFixed(1)} ms`,
      });
      break;
    }
  }

  console.log("📦 Raw Metric Object:", metric);
  console.groupEnd();
}

function getLoAFSeverityEmoji(duration: number): string {
  if (duration > 200) return "🔴";
  if (duration > 100) return "🟠";
  return "🟡";
}

function detectLoAFCategoryAndCulprit(
  entry: PerformanceLongAnimationFrameTiming,
  scripts: PerformanceScriptTiming[],
  styleAndLayoutTime: number,
): { category: FrameTimingSummary["category"]; culprit: string } {
  let category: FrameTimingSummary["category"] = "Script Task";
  let culprit = "Main Thread Execution";

  const hasRaf = scripts.some(
    (s) =>
      s.invoker?.includes("FrameRequestCallback") ||
      s.invoker?.includes("requestAnimationFrame") ||
      s.sourceFunctionName === "update" ||
      s.sourceFunctionName === "tick" ||
      s.sourceFunctionName?.includes("animate"),
  );
  const hasForcedReflow = scripts.some(
    (s) => s.forcedStyleAndLayoutDuration > 0,
  );
  const hasObserver = scripts.some(
    (s) =>
      s.invoker?.includes("ResizeObserver") ||
      s.invoker?.includes("IntersectionObserver"),
  );
  const hasInteraction =
    entry.firstUIEventTimestamp > 0 ||
    scripts.some((s) => s.invokerType === "event-listener");

  if (hasForcedReflow) {
    category = "Forced Reflow";
  } else if (hasRaf) {
    category = "Animation (rAF)";
  } else if (hasInteraction) {
    category = "Interaction";
  } else if (hasObserver) {
    category = "Observer";
  } else if (styleAndLayoutTime > 25) {
    category = "Style & Layout";
  }

  if (scripts.length > 0) {
    const longest = scripts.reduce(
      (max, s) => (s.duration > max.duration ? s : max),
      scripts[0],
    );
    const func = longest.sourceFunctionName || longest.invoker || "(script)";
    const src = cleanSourceUrl(longest.sourceURL, longest.sourceCharPosition);
    culprit = `${func} in ${src} (${longest.duration.toFixed(1)}ms)`;
  } else if (styleAndLayoutTime > 0) {
    culprit = `Recalculate Style & Layout (${styleAndLayoutTime.toFixed(1)}ms)`;
  }

  return { category, culprit };
}

/**
 * Analyzes and logs a single Long Animation Frame (LoAF) entry.
 */
function logLoAFEntry(
  entry: PerformanceLongAnimationFrameTiming,
  isNested = false,
): void {
  const duration = entry.duration;
  const blocking = entry.blockingDuration;
  const renderStart = entry.renderStart;
  const styleStart = entry.styleAndLayoutStart;

  // Calculate phase durations
  const scriptTime = renderStart > 0 ? renderStart - entry.startTime : duration;
  const renderTime =
    renderStart > 0 ? entry.startTime + duration - renderStart : 0;
  const styleAndLayoutTime =
    styleStart > 0 ? entry.startTime + duration - styleStart : 0;

  const scripts = entry.scripts || [];
  const { category, culprit } = detectLoAFCategoryAndCulprit(
    entry,
    scripts,
    styleAndLayoutTime,
  );
  const severityEmoji = getLoAFSeverityEmoji(duration);

  const groupLabel = `%cLoAF%c %c${category}%c ${severityEmoji} ${Math.round(duration)}ms (blocking: ${Math.round(blocking)}ms) – ${culprit}`;

  if (isNested) {
    console.group(
      groupLabel,
      LOAF_BADGE_STYLE,
      RESET_STYLE,
      CATEGORY_BADGE_STYLE,
      RESET_STYLE,
    );
  } else {
    console.groupCollapsed(
      groupLabel,
      LOAF_BADGE_STYLE,
      RESET_STYLE,
      CATEGORY_BADGE_STYLE,
      RESET_STYLE,
    );
  }

  const summary: FrameTimingSummary = {
    frameDuration: `${duration.toFixed(1)} ms`,
    blockingDuration: `${blocking.toFixed(1)} ms`,
    scriptDuration: `${scriptTime.toFixed(1)} ms`,
    renderDuration: `${renderTime.toFixed(1)} ms`,
    styleAndLayoutDuration: `${styleAndLayoutTime.toFixed(1)} ms`,
    uiEventBlocked: entry.firstUIEventTimestamp > 0,
    category,
    culprit,
  };

  console.log("⏱️ Frame Timing Summary:", summary);

  if (scripts.length > 0) {
    const scriptTable: ScriptLogItem[] = scripts.map((s) => ({
      invoker: s.invoker || "(none)",
      invokerType: s.invokerType || "(unknown)",
      function: s.sourceFunctionName || "(anonymous)",
      source: cleanSourceUrl(s.sourceURL, s.sourceCharPosition),
      duration: `${s.duration.toFixed(1)} ms`,
      forcedReflow:
        s.forcedStyleAndLayoutDuration > 0
          ? `${s.forcedStyleAndLayoutDuration.toFixed(1)} ms`
          : "-",
    }));

    console.log("📜 Script Execution Breakdown:");
    console.table(scriptTable);
  }

  console.log("📦 Raw LoAF Entry:", entry);
  console.groupEnd();
}

let isInitialized = false;

/**
 * Initializes Core Web Vitals logging and the Long Animation Frame (LoAF) observer.
 * Designed for development mode with zero production footprint.
 */
export function initPerformanceLogging(): void {
  if (isInitialized || typeof window === "undefined" || !import.meta.env.DEV) {
    return;
  }
  isInitialized = true;

  // Defer initialization to idle time to avoid interfering with initial hydration
  const scheduleInit =
    typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 100);

  scheduleInit(() => {
    // 1. Subscribe to Core Web Vitals with attribution
    onINP(logWebVital, {
      reportAllChanges: true,
      includeProcessedEventEntries: true,
    });
    onCLS(logWebVital, { reportAllChanges: true });
    onLCP(logWebVital, { reportAllChanges: true });
    onFCP(logWebVital);
    onTTFB(logWebVital);

    // 2. Observe Long Animation Frames (LoAF)
    if (
      typeof PerformanceObserver !== "undefined" &&
      PerformanceObserver.supportedEntryTypes?.includes("long-animation-frame")
    ) {
      try {
        const loafObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            logLoAFEntry(entry as PerformanceLongAnimationFrameTiming);
          }
        });
        loafObserver.observe({ type: "long-animation-frame", buffered: true });
      } catch (err) {
        console.debug("LoAF observation error:", err);
      }
    }
  });
}
