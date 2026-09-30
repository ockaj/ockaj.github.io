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

/**
 * Decode percent-encoded URL fragments safely.
 * Isolates malformed byte sequences to prevent errors.
 */
export function safeDecodeFragment(rawHash: string): string {
  const cleanHash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
  if (!cleanHash) return "";

  try {
    return decodeURIComponent(cleanHash);
  } catch {
    return cleanHash.replace(/(?:%[0-9a-fA-F]{2})+/g, (match) => {
      try {
        return decodeURIComponent(match);
      } catch {
        return "";
      }
    });
  }
}

/**
 * Find the indicated element from a decoded URL fragment.
 * Evaluates element IDs, legacy anchor names, and top shorthand per WHATWG HTML § 7.4.2.
 */
export function findIndicatedElement(
  decodedFragment: string,
): HTMLElement | null {
  if (!decodedFragment) return null;
  if (typeof document === "undefined") return null;

  const elementById = document.getElementById(decodedFragment);
  if (elementById) return elementById;

  const escaped =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(decodedFragment)
      : decodedFragment.replace(/(["\\])/g, "\\$1");
  try {
    const legacyAnchor = document.querySelector(`a[name="${escaped}"]`);
    if (legacyAnchor) {
      if (typeof HTMLElement !== "undefined") {
        return legacyAnchor instanceof HTMLElement ? legacyAnchor : null;
      }
      return legacyAnchor as HTMLElement;
    }
  } catch {
    // Return null if document.querySelector rejects the selector syntax
  }

  if (decodedFragment.toLowerCase() === "top") {
    return document.documentElement;
  }

  return null;
}

export function normalizeHash(rawHash: string): string {
  if (!rawHash) return "";
  const decoded = safeDecodeFragment(rawHash);
  return decoded.trim().toLowerCase().split("?")[0].split("&")[0];
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
