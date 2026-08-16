/**
 * Intercepts native DOM Node mutations to prevent fatal unhandled exceptions
 * and preserve animations caused by automated browser translation tools (such as Google Chrome Translate).
 *
 * Chrome Translate injects <font> tags around text nodes. This DOM mutation breaks
 * React reconciliation when React calls insertBefore or removeChild on nodes whose
 * parent references were changed by the browser.
 */
export function applyDomTranslatePatch(): void {
  if (
    typeof window === "undefined" ||
    typeof Node === "undefined" ||
    !Node.prototype
  ) {
    return;
  }

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(
    this: Node,
    child: T,
  ): T {
    const parentNode: Node | null = child.parentNode;
    if (parentNode !== this) {
      if (import.meta.env.DEV) {
        console.warn(
          "DOM translate patch prevented removeChild crash:",
          child,
          this,
        );
      }
      if (parentNode && typeof parentNode.removeChild === "function") {
        try {
          return originalRemoveChild.call(parentNode, child) as T;
        } catch {
          return child;
        }
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  const originalAppendChild = Node.prototype.appendChild;

  Node.prototype.insertBefore = function <T extends Node>(
    this: Node,
    newNode: T,
    referenceNode: Node | null,
  ): T {
    const parentNode: Node | null = referenceNode?.parentNode ?? null;
    if (referenceNode && parentNode !== this) {
      if (import.meta.env.DEV) {
        console.warn(
          "DOM translate patch prevented insertBefore crash:",
          referenceNode,
          this,
        );
      }

      // If referenceNode is inside this container (e.g. wrapped in <font>),
      // locate the top-level direct child of this container to insert before it.
      if (this.contains(referenceNode)) {
        let directChild: Node = referenceNode;
        let directParent: Node | null = directChild.parentNode;
        while (directParent && directParent !== this) {
          directChild = directParent;
          directParent = directChild.parentNode;
        }
        if (directParent === this) {
          return originalInsertBefore.call(this, newNode, directChild) as T;
        }
      }

      // Fallback: append newNode to this container so animated nodes are not dropped.
      return originalAppendChild.call(this, newNode) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}
