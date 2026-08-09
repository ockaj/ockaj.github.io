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
