import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const failures = [];

function fail(check, file, detail) {
  failures.push({ check, file, detail });
}

function readText(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function walkAllTsFiles(dirRel) {
  const sourceFiles = [];
  const testFiles = [];
  const absDir = path.join(ROOT, dirRel);
  if (!fs.existsSync(absDir)) return { sourceFiles, testFiles };

  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    const rel = path.posix.join(dirRel, entry.name);
    if (entry.isDirectory()) {
      const sub = walkAllTsFiles(rel);
      sourceFiles.push(...sub.sourceFiles);
      testFiles.push(...sub.testFiles);
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      if (
        rel.includes("/__tests__/") ||
        entry.name.endsWith(".test.ts") ||
        entry.name.endsWith(".test.tsx") ||
        entry.name.endsWith(".spec.ts") ||
        entry.name.endsWith(".spec.tsx")
      ) {
        testFiles.push(rel);
      } else {
        sourceFiles.push(rel);
      }
    }
  }
  return { sourceFiles, testFiles };
}

const { sourceFiles, testFiles } = walkAllTsFiles("src");
const allSourceCorpus = new Map(
  sourceFiles.map((file) => [file, readText(file)]),
);

// 1. Parse .agents/rules/component-imports.md feature boundary table
const componentImportsDoc = readText(".agents/rules/component-imports.md");
const featureRules = new Map();
for (const line of componentImportsDoc.split(/\r?\n/)) {
  const tableMatch = line.match(
    /^\|\s*`([A-Za-z]+)`\s*\|\s*([^|]+)\|\s*([^|]+)\|$/,
  );
  if (!tableMatch) continue;
  const featureDir = tableMatch[1];
  const publicEntries = [...tableMatch[2].matchAll(/`([^`]+)`/g)].map(
    (m) => m[1],
  );
  const privateEntries = [...tableMatch[3].matchAll(/`([^`]+)`/g)].map(
    (m) => m[1],
  );
  featureRules.set(featureDir, { publicEntries, privateEntries });
}

// Verify bidirectional parity between src/components/<Feature>/ and component-imports.md
for (const [
  featureDir,
  { publicEntries, privateEntries },
] of featureRules.entries()) {
  const documentedNames = new Set();
  for (const ref of [...publicEntries, ...privateEntries]) {
    const modName = ref.includes("/") ? ref.split("/")[1] : ref;
    documentedNames.add(modName);
    const relBase = `src/components/${featureDir}/${modName}`;
    const exists =
      fs.existsSync(path.join(ROOT, `${relBase}.ts`)) ||
      fs.existsSync(path.join(ROOT, `${relBase}.tsx`));
    if (!exists) {
      fail(
        "Rule Doc Module Exists",
        ".agents/rules/component-imports.md",
        `Documented module "${relBase}" does not exist on disk.`,
      );
    }
  }

  const absFeatureDir = path.join(ROOT, "src/components", featureDir);
  if (fs.existsSync(absFeatureDir)) {
    for (const entry of fs.readdirSync(absFeatureDir, {
      withFileTypes: true,
    })) {
      if (entry.isDirectory()) continue;
      if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
      const stem = entry.name.replace(/\.(?:ts|tsx)$/, "");
      if (!documentedNames.has(stem)) {
        fail(
          "Undocumented Feature Module",
          `src/components/${featureDir}/${entry.name}`,
          `Module "${stem}" is missing from .agents/rules/component-imports.md table.`,
        );
      }
    }
  }
}

// 2. Repo-Wide Source File Invariants (Seam Discipline, Error Handling, React 19, Anti-Bloat)
for (const [file, content] of allSourceCorpus.entries()) {
  const lines = content.split(/\r?\n/);

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const loc = `${file}:${lineNum}`;

    // Canonical Browser API Seams
    if (
      file !== "src/hooks/useAppNavigation.ts" &&
      /window\.history\.(?:replaceState|pushState)\b/.test(line)
    ) {
      fail(
        "History Seam",
        loc,
        "Use safeReplaceState or safePushState from src/hooks/useAppNavigation.ts.",
      );
    }

    if (
      file !== "src/hooks/useMediaQuery.ts" &&
      /window\.matchMedia\b/.test(line)
    ) {
      fail(
        "MediaQuery Seam",
        loc,
        "Use hooks or isReducedMotionPreferred from src/hooks/useMediaQuery.ts.",
      );
    }

    if (
      file !== "src/hooks/useResizeObserver.ts" &&
      /\bnew\s+ResizeObserver\b/.test(line)
    ) {
      fail(
        "ResizeObserver Seam",
        loc,
        "Use useResizeObserver from src/hooks/useResizeObserver.ts.",
      );
    }

    if (
      file !== "src/utils/idleCallback.ts" &&
      /window\.(?:requestIdleCallback|cancelIdleCallback)\b/.test(line)
    ) {
      fail(
        "IdleCallback Seam",
        loc,
        "Use requestIdle and cancelIdle from src/utils/idleCallback.ts.",
      );
    }

    if (
      file !== "src/components/Bpmn/bpmnStorage.ts" &&
      /window\.sessionStorage\b/.test(line)
    ) {
      fail(
        "SessionStorage Seam",
        loc,
        "Use getSessionStorageItem and setSessionStorageItem from src/components/Bpmn/bpmnStorage.ts.",
      );
    }

    if (file !== "src/utils/quicklink.ts" && /from\s+["']quicklink["']/.test(line)) {
      fail(
        "Quicklink Seam",
        loc,
        "Import prefetchAsset from src/utils/quicklink.ts instead of quicklink directly.",
      );
    }

    if (/from\s+["']framer-motion["']/.test(line)) {
      fail(
        "Motion Import Source",
        loc,
        'Import animations from "motion/react" instead of "framer-motion".',
      );
    }

    if (/\bdangerouslySetInnerHTML\b/.test(line)) {
      fail(
        "Zero innerHTML",
        loc,
        "dangerouslySetInnerHTML is prohibited by architecture security invariants.",
      );
    }

    // Type & Barrel Discipline
    if (/\bRecord\s*</.test(line)) {
      fail(
        "Forbid Record",
        loc,
        "Replace Record<K, V> with an explicit interface or index signature.",
      );
    }

    if (
      (file.startsWith("src/utils/") ||
        file.startsWith("src/hooks/") ||
        file.startsWith("src/store/") ||
        file.startsWith("src/data/")) &&
      /^\s*export\s+(?:\*|\{[^}]+\})\s+from\s+/.test(line)
    ) {
      fail(
        "No Re-Export Barrels",
        loc,
        "Export implementations directly from their owning module.",
      );
    }

    // React 19 & Data Immutability
    if (/\b(?:forwardRef|useContext)\s*\(/.test(line)) {
      fail(
        "React 19 Primitives",
        loc,
        "Use ref props instead of forwardRef and use(Context) instead of useContext.",
      );
    }

    if (file.startsWith("src/data/") && /\.sort\s*\(/.test(line)) {
      fail(
        "Immutable Sort",
        loc,
        "Use .toSorted() instead of mutating .sort() in data modules.",
      );
    }

    // Layer Inversion & Feature Encapsulation
    const importMatch = line.match(/from\s+["']([^"']+)["']/);
    if (importMatch) {
      const spec = importMatch[1];
      if (
        file.startsWith("src/utils/") &&
        /(?:^|[./])(?:hooks|store|components)\//.test(spec)
      ) {
        fail(
          "Layer Inversion",
          loc,
          `Tier 2 (utils) cannot import "${spec}" from higher tiers.`,
        );
      }
      if (
        (file.startsWith("src/store/") || file.startsWith("src/hooks/")) &&
        /(?:^|[./])components\//.test(spec)
      ) {
        fail(
          "Layer Inversion",
          loc,
          `Tier 3 (store/hooks) cannot import "${spec}" from Tier 4/5 components.`,
        );
      }

      for (const [featureDir, { publicEntries }] of featureRules.entries()) {
        const featureMatch = spec.match(
          new RegExp(`(?:^|[./])${featureDir}/([^"'.]+)`),
        );
        if (featureMatch && !file.startsWith(`src/components/${featureDir}/`)) {
          const importedSub = `${featureDir}/${featureMatch[1]}`;
          if (!publicEntries.includes(importedSub)) {
            fail(
              "Feature Boundary Leak",
              loc,
              `External import "${spec}" bypasses ${featureDir} public entry points (${publicEntries.join(", ")}).`,
            );
          }
        }
      }
    }
  });

  // Silent Error Swallowing
  if (/catch\s*(?:\([^)]*\))?\s*\{\s*\}/.test(content)) {
    fail(
      "No Empty Catch",
      file,
      "Empty catch block without fallback return, recovery state, or rationale.",
    );
  }
  if (/\.catch\(\s*\([^)]*\)\s*=>\s*\{\s*(?:\/\/[^\n]*\s*)*\}\s*\)/.test(content)) {
    fail(
      "No Silent Promise Catch",
      file,
      "Promise .catch() swallows errors without state rollback or fallback handling.",
    );
  }

  // React 19 useEffectEvent & Anti-Bloat Patterns
  if (
    /use(?:Layout)?Effect\(\(\)\s*=>\s*\{\s*(?:on[A-Z]\w*|[a-zA-Z]*[Cc]allback\w*|[a-zA-Z]*[Hh]andler\w*)Ref\.current\s*=/.test(
      content,
    )
  ) {
    fail(
      "React 19 useEffectEvent",
      file,
      "Use React 19 useEffectEvent instead of syncing callbacks into a ref inside an effect.",
    );
  }

  if (
    /useEffect\(\(\)\s*=>\s*\{\s*set[A-Z]\w*\(/.test(content)
  ) {
    fail(
      "No Sync setState in useEffect",
      file,
      "Derive state during render instead of calling setState synchronously at the top of useEffect.",
    );
  }

  if (
    /useMemo\(\(\)\s*=>\s*(?:normalize\w+|\w+\.findIndex|Boolean|String|Number)\(/.test(
      content,
    )
  ) {
    fail(
      "No Primitive useMemo",
      file,
      "Compute simple primitive expressions directly during render without useMemo.",
    );
  }

  if (
    /useCallback\(\s*\((\w+)(?::[^)]+)?\)\s*=>\s*\{\s*\w+\(\1\);\s*\}/.test(
      content,
    )
  ) {
    fail(
      "No Pass-Through useCallback",
      file,
      "Pass the underlying handler directly instead of wrapping it in a pass-through useCallback.",
    );
  }

  // Nested Interactive HTML in TSX
  if (file.endsWith(".tsx")) {
    if (/<Tab\b[\s\S]*?<button\b[\s\S]*?<\/Tab>/.test(content)) {
      fail(
        "Valid HTML Nesting",
        file,
        "Do not nest a <button> element inside a <Tab> button.",
      );
    }
    if (/<button\b[^>]*>[\s\S]*?<button\b[\s\S]*?<\/button>/.test(content)) {
      fail(
        "Valid HTML Nesting",
        file,
        "Do not nest a <button> element inside another <button>.",
      );
    }
  }

  // Dead useSpring allocations per file
  for (const m of content.matchAll(/const\s+(\w+)\s*=\s*useSpring\(/g)) {
    const springVar = m[1];
    const occurrences = content.match(new RegExp(`\\b${springVar}\\b`, "g"));
    if (!occurrences || occurrences.length < 2) {
      fail(
        "No Dead useSpring",
        file,
        `useSpring variable "${springVar}" is allocated but never consumed.`,
      );
    }
  }
}

// 3. Dead SPRING Preset Check across src/utils/springConfig.ts
const springConfigContent = readText("src/utils/springConfig.ts");
const springBlockMatch = springConfigContent.match(
  /export const SPRING = \{([\s\S]*?)\} as const;/,
);
if (springBlockMatch) {
  const springKeys = [
    ...springBlockMatch[1].matchAll(/^\s{2}([a-zA-Z0-9_]+):\s*\{/gm),
  ].map((m) => m[1]);
  const combinedCorpus = [...allSourceCorpus.values()].join("\n");
  for (const key of springKeys) {
    if (!new RegExp(`\\bSPRING\\.${key}\\b`).test(combinedCorpus)) {
      fail(
        "Unused SPRING Preset",
        "src/utils/springConfig.ts",
        `SPRING.${key} is defined in springConfig.ts but never referenced in src/.`,
      );
    }
  }
}

// 4. Key Architectural Seam Invariants
const navContent = readText("src/hooks/useAppNavigation.ts");
if (!navContent.includes("isValidModalHash(currentHash)")) {
  fail(
    "ScrollSpy Modal Guard",
    "src/hooks/useAppNavigation.ts",
    "commitScrollSpyHash must guard modal hashes via isValidModalHash(currentHash).",
  );
}
if (
  !/function alignParentSection[\s\S]*?setActiveSection\(parentSection\)/.test(
    navContent,
  )
) {
  fail(
    "Modal Parent Section Sync",
    "src/hooks/useAppNavigation.ts",
    "alignParentSection must synchronize activeSection to parentSection.",
  );
}

const processLibContent = readText(
  "src/components/ProcessLibrary/ProcessLibrary.tsx",
);
if (
  !processLibContent.includes('useEntityModal("lightbox", PROCESS_ITEMS_BY_ID)')
) {
  fail(
    "Lightbox Seam",
    "src/components/ProcessLibrary/ProcessLibrary.tsx",
    'ProcessLibrary must manage lightbox state via useEntityModal("lightbox", PROCESS_ITEMS_BY_ID).',
  );
}

const navbarContent = readText("src/components/Navigation/Navbar.tsx");
if (!navbarContent.includes('useModal("nav")')) {
  fail(
    "Navbar Modal Seam",
    "src/components/Navigation/Navbar.tsx",
    'Navbar must manage mobile menu modal state via useModal("nav").',
  );
}

const pdfModalContent = readText(
  "src/components/PdfViewerModal/PdfViewerModal.tsx",
);
if (/\bsm:(?:hidden|flex)\b/.test(pdfModalContent)) {
  fail(
    "Breakpoint Alignment",
    "src/components/PdfViewerModal/PdfViewerModal.tsx",
    "Align responsive header actions and tabs on md: (768px) to match useIsMobile().",
  );
}

const articlesContent = readText("src/data/articles.ts");
if (
  !articlesContent.includes("fm.readTime || mod.readTime") ||
  !articlesContent.includes("fm.excerpt || mod.excerpt")
) {
  fail(
    "Frontmatter Precedence",
    "src/data/articles.ts",
    "Frontmatter fm.readTime and fm.excerpt must take precedence over generated mod defaults.",
  );
}

// 5. Test Suite Quality & Boundary Coverage across __tests__
for (const testFile of testFiles) {
  const content = readText(testFile);

  if (!/\bdescribe\s*\(/.test(content) || !/\b(?:it|test)\s*\(/.test(content)) {
    fail(
      "Test Structure",
      testFile,
      "Test file must contain describe() and it()/test() blocks.",
    );
  }

  if (/\b(?:describe|it|test)\.(?:only|skip)\b/.test(content)) {
    fail(
      "No Focused or Skipped Tests",
      testFile,
      "Remove .only or .skip modifiers from test definitions.",
    );
  }

  if (/expect\(\s*(?:true|false|1|0)\s*\)\.toBe\(\s*(?:true|false|1|0)\s*\)/.test(content)) {
    fail(
      "No Tautological Assertions",
      testFile,
      "Replace tautological expect(literal).toBe(literal) with real behavioral assertions.",
    );
  }

  const itBlocks = content.split(/\b(?:it|test)\s*\(/).slice(1);
  for (const block of itBlocks) {
    if (!/\bexpect\s*\(/.test(block)) {
      fail(
        "Assertion Required",
        testFile,
        "Every it()/test() block must contain at least one expect() assertion.",
      );
    }
  }

  if (
    !/\b(?:null|undefined|false|NaN|throw|Error|invalid|empty|missing|reduced|fallback|unknown)\b/i.test(
      content,
    )
  ) {
    fail(
      "Boundary Test Coverage",
      testFile,
      "Test file must include boundary, invalid-input, or failure-path test cases.",
    );
  }
}

// 6. Config & Metadata Parity
const doctorConfig = readText("doctor.config.ts");
for (const match of doctorConfig.matchAll(/"(src\/[^"]+)"/g)) {
  const targetFile = match[1];
  if (!fs.existsSync(path.join(ROOT, targetFile))) {
    fail(
      "Doctor Config Target Exists",
      "doctor.config.ts",
      `Referenced file "${targetFile}" does not exist.`,
    );
  }
}

const faqDataContent = readText("src/data/faqData.ts");
const indexHtmlContent = readText("index.html");
for (const m of faqDataContent.matchAll(/question:\s*"([^"]+)"/g)) {
  const question = m[1];
  if (!indexHtmlContent.includes(question)) {
    fail(
      "FAQ JSON-LD Parity",
      "index.html",
      `Missing FAQ question in JSON-LD: "${question}"`,
    );
  }
}

if (failures.length > 0) {
  console.error(`\n✗ Exit Gate Failed (${failures.length} issue(s)):`);
  for (const f of failures) {
    console.error(`  [${f.check}] ${f.file} -> ${f.detail}`);
  }
  process.exit(1);
}

console.log(
  `✓ Exit Gate Passed (${sourceFiles.length} source files, ${testFiles.length} test suites, config targets, and rule docs verified).`,
);
