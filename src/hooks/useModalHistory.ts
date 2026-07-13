import { useEffect, useRef } from "react";
import { registerOverlay } from "../utils/overlayManager";

/**
 * Custom hook to intercept browser back-navigation events (swipes, back button)
 * to close open overlays instead of exiting the page, managed by a centralized manager.
 *
 * @param isOpen Indicates if the modal overlay is currently open.
 * @param onClose Callback function to close the modal overlay.
 * @param id Optional identifier for the overlay type.
 */
export function useModalHistory(
  isOpen: boolean,
  onClose: () => void,
  id = "modal",
) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const unregister = registerOverlay(id, () => {
      onCloseRef.current();
    });

    return () => {
      unregister();
    };
  }, [isOpen, id]);
}
