let cachedSlowConnection: boolean | null = null;

export const isSlowConnection = (): boolean => {
  if (cachedSlowConnection !== null) return cachedSlowConnection;

  if (
    typeof window !== "undefined" &&
    (window as unknown as { __BONEYARD_BUILD?: boolean }).__BONEYARD_BUILD
  ) {
    cachedSlowConnection = false;
    return false;
  }
  if (typeof navigator === "undefined") return false;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    cachedSlowConnection = true;
    return true;
  }
  const conn = (
    navigator as unknown as {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (conn) {
    const isSlow =
      !!conn.saveData ||
      ["slow-2g", "2g", "3g"].includes(conn.effectiveType || "");
    cachedSlowConnection = isSlow;
    return isSlow;
  }
  cachedSlowConnection = false;
  return false;
};
