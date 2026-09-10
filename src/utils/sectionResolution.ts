/**
 * URL hash resolution and validation utilities.
 * Complies with ASD-STE100 Simplified Technical English.
 */

const SECTION_SET = new Set<string>([
  "home",
  "work",
  "skills",
  "processes",
  "journal",
  "faq",
  "contact",
]);

export function normalizeHash(rawHash: string): string {
  if (!rawHash) return "";
  const clean = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
  return clean.trim().toLowerCase().split("?")[0].split("&")[0];
}

/**
 * Resolve the parent section identifier from a URL hash string.
 * Maps modal hashes to their parent section (e.g. #case-study-1 -> work).
 */
export function resolveSectionFromHash(hash: string): string {
  const clean = normalizeHash(hash);
  if (!clean) return "home";

  if (SECTION_SET.has(clean)) {
    return clean;
  }

  if (clean.startsWith("case-study-")) {
    return "work";
  }
  if (clean.startsWith("article-")) {
    return "journal";
  }
  if (clean.startsWith("lightbox-")) {
    return "processes";
  }
  if (
    clean === "cv" ||
    clean === "bpmn" ||
    clean === "nav" ||
    clean === "menu"
  ) {
    return "home";
  }

  return "home";
}

/**
 * Validate if a hash string matches a supported modal or overlay.
 */
export function isValidModalHash(hash: string): boolean {
  const clean = normalizeHash(hash);
  if (!clean) return false;

  if (
    clean === "cv" ||
    clean === "bpmn" ||
    clean === "nav" ||
    clean === "menu"
  ) {
    return true;
  }
  if (clean.startsWith("case-study-") && clean.length > "case-study-".length) {
    return true;
  }
  if (clean.startsWith("article-") && clean.length > "article-".length) {
    return true;
  }
  if (
    clean.startsWith("lightbox-") &&
    /^\d+$/.test(clean.slice("lightbox-".length))
  ) {
    return true;
  }

  return false;
}

/**
 * Check if a modal hash is transient and must dismiss on reload.
 */
export function isTransientModalHash(hash: string): boolean {
  const clean = normalizeHash(hash);
  return clean === "nav" || clean === "menu";
}
