interface NetworkInfoLike {
  saveData?: boolean;
  effectiveType?: string;
}

function getNetworkConnection(): NetworkInfoLike | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }
  return (navigator as Navigator & { connection?: NetworkInfoLike }).connection;
}

/**
 * Determines whether the user connection is heavily constrained (slow-2g, 2g, or saveData).
 */
export function isConnectionConstrained(): boolean {
  const conn = getNetworkConnection();
  if (!conn) {
    return false;
  }
  return Boolean(
    conn.saveData ||
    conn.effectiveType === "slow-2g" ||
    conn.effectiveType === "2g",
  );
}

/**
 * Returns the intersection root margin based on connection quality:
 * - Constrained (slow-2g, 2g, saveData): "400px 0px"
 * - Moderate (3g): "800px 0px"
 * - Normal (4g, unconstrained, SSR): "1200px 0px"
 */
export function getConnectionRootMargin(): string {
  const conn = getNetworkConnection();
  if (!conn) {
    return "1200px 0px";
  }

  if (
    conn.saveData ||
    conn.effectiveType === "slow-2g" ||
    conn.effectiveType === "2g"
  ) {
    return "400px 0px";
  }

  if (conn.effectiveType === "3g") {
    return "800px 0px";
  }

  return "1200px 0px";
}
