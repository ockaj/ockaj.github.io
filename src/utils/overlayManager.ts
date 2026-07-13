// Central manager for browser history and scroll-locking of all overlay panels (modals, drawers, lightboxes)
type OverlayCallback = () => void;

interface ActiveOverlay {
  id: string;
  onClose: OverlayCallback;
  stateId: string;
}

const activeStack: ActiveOverlay[] = [];
let originalOverflow = "";
let scrollY = 0;
let iosScrollLockActive = false;

// iOS scroll lock original styles
let originalPosition = "";
let originalTop = "";
let originalWidth = "";
let originalHeight = "";
let htmlOriginalHeight = "";
let htmlOriginalOverflow = "";

const isIOS =
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

const lockScroll = () => {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  if (isIOS) {
    if (iosScrollLockActive) return;
    scrollY = window.scrollY;
    originalPosition = document.body.style.position;
    originalTop = document.body.style.top;
    originalWidth = document.body.style.width;
    originalHeight = document.body.style.height;
    htmlOriginalHeight = document.documentElement.style.height;
    htmlOriginalOverflow = document.documentElement.style.overflow;

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    document.body.style.overflow = "hidden";
    document.documentElement.style.height = "100%";
    document.documentElement.style.overflow = "hidden";
    iosScrollLockActive = true;
  } else {
    if (document.body.style.overflow === "hidden") return;
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
};

const unlockScroll = () => {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  if (isIOS) {
    if (!iosScrollLockActive) return;
    const htmlEl = document.documentElement;
    const originalScrollBehavior = htmlEl.style.scrollBehavior;
    htmlEl.style.scrollBehavior = "auto";

    document.body.style.position = originalPosition;
    document.body.style.top = originalTop;
    document.body.style.width = originalWidth;
    document.body.style.height = originalHeight;
    document.body.style.overflow = originalOverflow;
    document.documentElement.style.height = htmlOriginalHeight;
    document.documentElement.style.overflow = htmlOriginalOverflow;

    // Force reflow
    void document.body.offsetHeight;

    window.scrollTo(0, scrollY);

    requestAnimationFrame(() => {
      htmlEl.style.scrollBehavior = originalScrollBehavior;
    });
    iosScrollLockActive = false;
  } else {
    document.body.style.overflow = originalOverflow;
  }
};

const handlePopState = (e: PopStateEvent) => {
  const state = e.state as { stateId?: string } | null;
  const index = state?.stateId
    ? activeStack.findIndex((item) => item.stateId === state.stateId)
    : -1;

  if (index === -1) {
    activeStack.pop()?.onClose();
  } else {
    while (activeStack.length > index + 1) {
      activeStack.pop()?.onClose();
    }
  }

  if (activeStack.length === 0) {
    unlockScroll();
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && activeStack.length > 0) {
    e.preventDefault();
    activeStack[activeStack.length - 1]?.onClose();
  }
};

const pendingBacks = new Map<string, ReturnType<typeof setTimeout>>();
let popStateRegistered = false;

const ensurePopStateListener = () => {
  if (typeof window === "undefined" || popStateRegistered) return;
  window.addEventListener("popstate", handlePopState);
  window.addEventListener("keydown", handleKeyDown);
  popStateRegistered = true;
};

export const registerOverlay = (
  id: string,
  onClose: OverlayCallback,
): (() => void) => {
  ensurePopStateListener();

  if (activeStack.length === 0) {
    lockScroll();
  }

  const currentHistoryStateId =
    typeof window !== "undefined" ? window.history.state?.stateId : null;
  const hasPending = !!(
    currentHistoryStateId && pendingBacks.has(currentHistoryStateId)
  );
  const stateId =
    hasPending && currentHistoryStateId
      ? currentHistoryStateId
      : `overlay-${id}-${Math.random().toString(36).substring(2, 9)}`;

  if (hasPending && currentHistoryStateId) {
    const timeoutId = pendingBacks.get(currentHistoryStateId);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    pendingBacks.delete(currentHistoryStateId);
  } else if (typeof window !== "undefined") {
    window.history.pushState({ stateId }, "");
  }

  const overlayInfo: ActiveOverlay = { id, onClose, stateId };
  activeStack.push(overlayInfo);

  return () => {
    const idx = activeStack.findIndex((item) => item.stateId === stateId);
    if (idx === -1) return;
    activeStack.splice(idx, 1);

    if (
      typeof window !== "undefined" &&
      window.history.state?.stateId === stateId
    ) {
      const timeoutId = setTimeout(() => {
        pendingBacks.delete(stateId);
        if (window.history.state?.stateId === stateId) {
          window.history.back();
        }
        if (activeStack.length === 0) {
          unlockScroll();
        }
      }, 0);
      pendingBacks.set(stateId, timeoutId);
      return;
    }
    if (activeStack.length === 0) {
      unlockScroll();
    }
  };
};
