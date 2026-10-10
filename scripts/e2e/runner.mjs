import { chromium } from "playwright";
import { preview } from "vite";
import { setTimeout as sleep } from "node:timers/promises";
import process from "node:process";

import * as clsSuite from "./suites/cls.mjs";
import * as navSuite from "./suites/navigation.mjs";
import * as componentsSuite from "./suites/components.mjs";
import * as skeletonsSuite from "./suites/skeletons.mjs";
import * as runtimeSuite from "./suites/runtime.mjs";
import * as bpmnSuite from "./suites/bpmn.mjs";
import * as sessionSuite from "./suites/session.mjs";
import * as a11ySuite from "./suites/a11y.mjs";

const ALL_SUITES = [
  clsSuite,
  navSuite,
  componentsSuite,
  skeletonsSuite,
  runtimeSuite,
  bpmnSuite,
  sessionSuite,
  a11ySuite,
];

const PORT = 4173;

function parseRequestedSuites() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: node scripts/e2e/runner.mjs [suite...]");
    console.log("       npm run test:e2e -- [suite...]");
    console.log("       npm run test:e2e -- --suite=<name>\n");
    console.log("Available suites:");
    for (const s of ALL_SUITES) {
      console.log(`  - ${s.id.padEnd(12)} (${s.name})`);
    }
    console.log("  - all          (Run all suites, default)\n");
    process.exit(0);
  }

  if (args.includes("--list")) {
    console.log("Available suites:", ALL_SUITES.map((s) => s.id).join(", "));
    process.exit(0);
  }

  const requestedIds = new Set();

  for (const arg of args) {
    if (arg.startsWith("--suite=")) {
      arg
        .slice("--suite=".length)
        .split(",")
        .forEach((id) => requestedIds.add(id.trim().toLowerCase()));
    } else if (!arg.startsWith("-")) {
      requestedIds.add(arg.trim().toLowerCase());
    }
  }

  if (requestedIds.size === 0 || requestedIds.has("all")) {
    return ALL_SUITES;
  }

  const selected = ALL_SUITES.filter((s) => requestedIds.has(s.id));
  if (selected.length === 0) {
    console.error(`Unknown suite filter: "${Array.from(requestedIds).join(", ")}"`);
    console.error(`Valid suites: ${ALL_SUITES.map((s) => s.id).join(", ")}`);
    process.exit(1);
  }
  return selected;
}

async function main() {
  const suitesToRun = parseRequestedSuites();

  console.log("=== Modular Playwright E2E Runner ===");
  console.log(`Selected suites: ${suitesToRun.map((s) => s.name).join(", ")}\n`);

  let server;
  let browser;

  const consoleErrors = [];
  const pageErrors = [];
  const testResults = [];

  function record(name, passed, details = "") {
    testResults.push({ name, passed, details });
    const mark = passed ? "✓ PASS" : "✗ FAIL";
    console.log(`${mark}: ${name}${details ? ` (${details})` : ""}`);
  }

  try {
    console.log(`Starting Vite preview server on port ${PORT}...`);
    server = await preview({
      root: process.cwd(),
      preview: {
        port: PORT,
        strictPort: false,
        host: "localhost",
      },
    });

    const urls = server.resolvedUrls?.local?.[0] || `http://localhost:${PORT}/`;
    console.log(`✓ Preview server ready on ${urls}\n`);

    console.log("Launching headless Chromium...");
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });

    const page = await context.newPage();

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    for (const suite of suitesToRun) {
      await suite.run({
        page,
        urls,
        record,
        sleep,
        consoleErrors,
        pageErrors,
      });
    }

    const totalPassed = testResults.filter((r) => r.passed).length;
    const totalFailed = testResults.filter((r) => !r.passed).length;

    console.log("\n=== E2E Test Summary ===");
    console.log(`Total Checks: ${testResults.length} | Passed: ${totalPassed} | Failed: ${totalFailed}`);

    if (totalFailed > 0 || pageErrors.length > 0) {
      console.error("\n❌ E2E verification failed with errors!");
      process.exitCode = 1;
    } else {
      console.log("\n✓ All selected E2E suites passed successfully!\n");
      process.exitCode = 0;
    }
  } catch (error) {
    console.error("\n❌ Unhandled error during E2E run:", error);
    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (server) {
      await server.httpServer?.close();
    }
    const hasFailures =
      testResults.some((r) => !r.passed) ||
      pageErrors.length > 0 ||
      consoleErrors.length > 0;
    process.exit(hasFailures ? 1 : 0);
  }
}

main();
