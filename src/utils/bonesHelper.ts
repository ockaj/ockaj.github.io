import type { CSSProperties } from "react";
import _case_studies from "../bones/case-studies.bones.json";
import _contact from "../bones/contact.bones.json";
import _faq from "../bones/faq.bones.json";
import _journal from "../bones/journal.bones.json";
import _processes from "../bones/processes.bones.json";
import _skills from "../bones/skills.bones.json";

interface SkeletonHeights {
  mob: number;
  tab: number;
  desk: number;
  wide: number;
}

type BonesDoc = {
  breakpoints?: {
    [key: string]: { height: number } | undefined;
  };
};

const BONES_MAP: { [key: string]: BonesDoc } = {
  "case-studies": _case_studies,
  contact: _contact,
  faq: _faq,
  journal: _journal,
  processes: _processes,
  skills: _skills,
};

function getSkeletonHeights(name: string): SkeletonHeights {
  const bp = BONES_MAP[name]?.breakpoints;
  const mob = bp?.["375"]?.height ?? 0;
  const tab = bp?.["768"]?.height ?? mob;
  const desk = bp?.["1024"]?.height ?? tab;
  const wide = bp?.["1280"]?.height ?? desk;
  return { mob, tab, desk, wide };
}

const SKELETON_STYLES_MAP: Record<string, CSSProperties> = Object.fromEntries(
  Object.keys(BONES_MAP).map((name) => {
    const { mob, tab, desk, wide } = getSkeletonHeights(name);
    const style: CSSProperties = {
      "--skeleton-min-h-mob": mob > 0 ? `${mob}px` : undefined,
      "--skeleton-min-h-tab": tab > 0 ? `${tab}px` : undefined,
      "--skeleton-min-h-desk": desk > 0 ? `${desk}px` : undefined,
      "--skeleton-min-h-wide": wide > 0 ? `${wide}px` : undefined,
    } as CSSProperties;
    return [name, style];
  }),
);

const EMPTY_STYLE: CSSProperties = {};

export function getSkeletonStyle(name: string): CSSProperties {
  return SKELETON_STYLES_MAP[name] ?? EMPTY_STYLE;
}

declare global {
  interface Window {
    __BONEYARD_BUILD?: boolean;
  }
}

/**
 * Helper to check if the app is currently running in Boneyard skeleton capture mode.
 */
export function isBoneyardBuild(): boolean {
  return typeof window !== "undefined" && Boolean(window.__BONEYARD_BUILD);
}
