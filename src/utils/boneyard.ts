/**
 * Helper to check if the app is currently running in Boneyard skeleton capture mode.
 */
export function isBoneyardBuild(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(
      (window as unknown as { __BONEYARD_BUILD?: boolean }).__BONEYARD_BUILD,
    )
  );
}
