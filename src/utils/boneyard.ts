declare global {
  interface Window {
    __BONEYARD_BUILD?: boolean;
  }
}

/**
 * Check if the application runs in Boneyard skeleton capture mode.
 */
export function isBoneyardBuild(): boolean {
  return typeof window !== "undefined" && Boolean(window.__BONEYARD_BUILD);
}
