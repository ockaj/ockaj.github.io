import _case_studies from "../bones/case-studies.bones.json";
import _contact from "../bones/contact.bones.json";
import _faq from "../bones/faq.bones.json";
import _journal from "../bones/journal.bones.json";
import _processes from "../bones/processes.bones.json";
import _skills from "../bones/skills.bones.json";

export interface SkeletonHeights {
  mob: number;
  tab: number;
  desk: number;
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

export function getSkeletonHeights(name: string): SkeletonHeights {
  const bp = BONES_MAP[name]?.breakpoints;
  const mob = bp?.["375"]?.height ?? 0;
  const tab = bp?.["768"]?.height ?? mob;
  const desk = bp?.["1024"]?.height ?? bp?.["1280"]?.height ?? tab;
  return { mob, tab, desk };
}
