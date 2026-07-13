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

  // Calculate scrollbar width to prevent page shift
  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }

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

  document.body.style.paddingRight = "";

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
  if (!state || !state.stateId) {
    if (activeStack.length > 0) {
      const top = activeStack.pop();
      if (top) {
        top.onClose();
        if (activeStack.length === 0) {
          unlockScroll();
        }
      }
    }
    return;
  }

  const index = activeStack.findIndex((item) => item.stateId === state.stateId);
  if (index === -1) {
    if (activeStack.length > 0) {
      const top = activeStack.pop();
      if (top) {
        top.onClose();
        if (activeStack.length === 0) {
          unlockScroll();
        }
      }
    }
  } else {
    while (activeStack.length > index + 1) {
      const top = activeStack.pop();
      if (top) {
        top.onClose();
      }
    }
    if (activeStack.length === 0) {
      unlockScroll();
    }
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && activeStack.length > 0) {
    e.preventDefault();
    const top = activeStack[activeStack.length - 1];
    if (top) {
      top.onClose();
    }
  }
};

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

  const stateId = `overlay-${id}-${Math.random().toString(36).substring(2, 9)}`;
  const overlayInfo: ActiveOverlay = { id, onClose, stateId };
  activeStack.push(overlayInfo);

  // Push state to browser history to catch the back button
  window.history.pushState({ stateId }, "");

  return () => {
    const idx = activeStack.findIndex((item) => item.stateId === stateId);
    if (idx !== -1) {
      activeStack.splice(idx, 1);

      if (window.history.state?.stateId === stateId) {
        window.history.back();
      }
    }
    if (activeStack.length === 0) {
      unlockScroll();
    }
  };
};
