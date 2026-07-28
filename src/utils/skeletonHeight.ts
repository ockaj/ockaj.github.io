export const getSkeletonHeight = (bonesData: {
  breakpoints?: Record<string, { height: number }>;
}): number => {
  if (typeof window === "undefined" || !bonesData?.breakpoints) return 0;
  const width = window.innerWidth;
  const bp = bonesData.breakpoints;
  return (
    (width >= 1024 ? bp["1024"] : width >= 768 ? bp["768"] : bp["375"])
      ?.height ?? 0
  );
};
