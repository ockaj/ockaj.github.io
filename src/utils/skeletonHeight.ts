export const getSkeletonHeight = (bonesData: {
  breakpoints?: Record<string, { height: number }>;
}): number => {
  if (typeof window === "undefined" || !bonesData?.breakpoints) return 0;
  const width = window.innerWidth;
  const bp = bonesData.breakpoints;
  let targetBp = bp["375"];
  if (width >= 1024) {
    targetBp = bp["1024"];
  } else if (width >= 768) {
    targetBp = bp["768"];
  }
  return targetBp?.height ?? 0;
};
