export const getSkeletonHeight = (bonesData: {
  breakpoints?: Record<string, { height: number }>;
}): number => {
  if (typeof window === "undefined" || !bonesData || !bonesData.breakpoints)
    return 0;
  const width = window.innerWidth;
  const breakpoints = Object.keys(bonesData.breakpoints)
    .map(Number)
    .sort((a, b) => b - a);
  const matchedBp =
    breakpoints.find((bp) => width >= bp) ??
    breakpoints[breakpoints.length - 1];
  return bonesData.breakpoints[matchedBp]?.height ?? 0;
};
