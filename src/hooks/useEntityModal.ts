import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  startTransition,
} from "react";
import { useAppStore } from "../store/useAppStore";
import { resolveSectionFromHash } from "../utils/sectionResolution";

interface IdentifiableEntity {
  readonly id: string | number;
}

export type EntityLookup<T, TId extends string | number = string | number> =
  ReadonlyMap<TId, T> | ((id: string) => T | null | undefined);

interface DrawerBindings {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onExitComplete: () => void;
}

export interface EntityModalOptions {
  readonly fallbackHash?: string;
}

export interface EntityModalResult<T> {
  readonly isOpen: boolean;
  readonly selected: T | null;
  readonly displayed: T | null;
  readonly open: (target: T | string | number) => void;
  readonly close: () => void;
  readonly onExitComplete: () => void;
  readonly drawerProps: DrawerBindings;
}

/**
 * Normalize prefix strings to enforce a trailing hyphen delimiter.
 */
export function normalizePrefix(raw: string): string {
  return raw.endsWith("-") ? raw : `${raw}-`;
}

/**
 * Format modal identifier string from prefix and target entity or identifier.
 */
export function formatEntityModalId(
  prefix: string,
  target: unknown,
): string | null {
  const normalized = normalizePrefix(prefix);
  if (typeof target === "string" || typeof target === "number") {
    return `${normalized}${target}`;
  }
  if (target && typeof target === "object" && "id" in target) {
    const id = (target as IdentifiableEntity).id;
    if (typeof id === "string" || typeof id === "number") {
      return `${normalized}${id}`;
    }
  }
  return null;
}

/**
 * Resolve entity from lookup collection using extracted identifier.
 */
export function resolveEntity<T, TId extends string | number = string | number>(
  lookup: EntityLookup<T, TId>,
  id: string,
): T | null {
  if (typeof lookup === "function") {
    return lookup(id) ?? null;
  }
  const direct = lookup.get(id as unknown as TId);
  if (direct !== undefined) {
    return direct;
  }
  const numericId = Number(id);
  if (!Number.isNaN(numericId)) {
    const numericDirect = lookup.get(numericId as unknown as TId);
    if (numericDirect !== undefined) {
      return numericDirect;
    }
  }
  return null;
}

/**
 * Resolve target recovery hash when URL contains an invalid entity identifier.
 */
export function resolveEntityFallbackHash(
  prefix: string,
  fallbackHash?: string,
): string {
  if (fallbackHash) {
    return fallbackHash;
  }
  const normalized = normalizePrefix(prefix);
  return `#${resolveSectionFromHash(normalized)}`;
}

/**
 * Universal hook to synchronize entity detail modals with application state and URL hash history.
 * Follows codebase-design deep module principles and Vercel React best practices.
 */
export function useEntityModal<
  T,
  TId extends string | number = string | number,
>(
  prefix: string,
  lookup: EntityLookup<T, TId>,
  options?: EntityModalOptions,
): EntityModalResult<T> {
  const normalizedPrefix = useMemo(() => normalizePrefix(prefix), [prefix]);

  // Subscribe to the derived entity identifier to prevent re-renders on unrelated store mutations
  const activeId = useAppStore((state) => {
    const modal = state.activeModal;
    if (!modal || !modal.startsWith(normalizedPrefix)) {
      return null;
    }
    return modal.slice(normalizedPrefix.length);
  });

  const selected = useMemo(() => {
    if (!activeId) return null;
    return resolveEntity(lookup, activeId);
  }, [activeId, lookup]);

  // Buffer state during render to preserve content during drawer exit transitions
  const [displayed, setDisplayed] = useState<T | null>(selected);
  const [prevSelected, setPrevSelected] = useState<T | null>(selected);

  if (selected !== prevSelected) {
    setPrevSelected(selected);
    if (selected !== null) {
      setDisplayed(selected);
    }
  }

  const fallbackHash = options?.fallbackHash;

  // Repair browser history if active modal hash does not match an existing entity
  useEffect(() => {
    if (activeId && !selected) {
      useAppStore.getState().closeModal();
      if (typeof window !== "undefined") {
        const targetHash = resolveEntityFallbackHash(
          normalizedPrefix,
          fallbackHash,
        );
        window.history.replaceState(window.history.state, "", targetHash);
      }
    }
  }, [activeId, selected, fallbackHash, normalizedPrefix]);

  const open = useCallback(
    (target: T | string | number) => {
      const modalId = formatEntityModalId(normalizedPrefix, target);
      if (!modalId) return;

      startTransition(() => {
        useAppStore.getState().openModal(modalId);
      });
    },
    [normalizedPrefix],
  );

  const close = useCallback(() => {
    startTransition(() => {
      useAppStore.getState().closeModal();
    });
  }, []);

  const onExitComplete = useCallback(() => {
    setDisplayed(null);
  }, []);

  const isOpen = selected !== null;

  const drawerProps = useMemo<DrawerBindings>(
    () => ({
      open: isOpen,
      onClose: close,
      onExitComplete,
    }),
    [isOpen, close, onExitComplete],
  );

  return {
    isOpen,
    selected,
    displayed,
    open,
    close,
    onExitComplete,
    drawerProps,
  };
}
