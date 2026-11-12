/**
 * Detects Android platform using navigator.platform and userAgent.
 */
export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  const userAgent = (navigator.userAgent || "").toLowerCase();
  const platform = (navigator.platform || "").toLowerCase();
  return platform === "android" || userAgent.includes("android");
}

/**
 * Detects whether a click event was synthesized by assistive technology
 * or is a physical release click.
 */
export function isVirtualClick(event: MouseEvent): boolean {
  const pointerType = (event as unknown as { pointerType?: string })
    .pointerType;
  if (pointerType === "" && event.isTrusted) {
    return true;
  }
  // Android Chrome TalkBack sends click with buttons === 1
  if (isAndroid() && pointerType) {
    return event.type === "click" && event.buttons === 1;
  }
  return event.detail === 0 && !pointerType;
}
