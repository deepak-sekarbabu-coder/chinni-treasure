"use client";

/**
 * The Modal module — the one owner of the dialog scaffold.
 *
 * Before this, the scaffold was restated per modal: four Escape mechanisms
 * (overlay `onKeyDown`, a `document` listener, a `window` listener, and a
 * parent that suppressed Escape for a nested child), two scroll-lock styles
 * (one restoring `""` over whatever was there), and two modals with no focus
 * trap at all. This component owns all of it; a modal supplies content and its
 * close policy.
 *
 * The interface is deliberately the same for every caller:
 *
 *   <Modal open onClose labelledBy="x" overlayClassName contentClassName>
 *
 * Nesting is handled by a module-level stack: only the top-most open Modal
 * reacts to Escape, so a child never needs its parent to stand down.
 *
 * `overlayClassName` / `contentClassName` exist because each surface has its
 * own CSS shell (`.modal-overlay` + `.modal-content`, the shipping nudge sheet,
 * the gift-popup card). Owning the scaffold is not owning the skin.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { useFocusTrap } from "@/src/lib/useFocusTrap";

/** Open modals, oldest first. The last entry owns Escape. */
const stack: symbol[] = [];

/** How many modals currently hold the scroll lock. */
let scrollLocks = 0;
let previousOverflow: string | null = null;

/**
 * Close the top-most modal on Escape. One document listener would be tidier,
 * but each modal owning its own listener is what lets the stack decide who
 * acts — a shared listener would need a subscription protocol to say the same
 * thing.
 */
function useEscapeStack(open: boolean, onEscape: (() => void) | undefined) {
  const id = useRef<symbol>(Symbol("modal"));
  const handler = useRef(onEscape);

  // Synced in an effect, not during render: the listener is registered once per
  // open, so re-registering on every `onClose` identity change would re-push
  // this modal onto the stack and let a parent overtake its own child.
  useEffect(() => {
    handler.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!open) return;
    const token = id.current;
    stack.push(token);
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape" || stack[stack.length - 1] !== token) return;
      handler.current?.();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const i = stack.indexOf(token);
      if (i !== -1) stack.splice(i, 1);
    };
  }, [open]);
}

/**
 * Lock body scroll while any modal is open, restoring the value that was there
 * before — not `""`. The counter is what makes nesting work: the child must not
 * release the lock the parent is still holding.
 */
function useScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    if (scrollLocks === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    scrollLocks += 1;
    return () => {
      scrollLocks -= 1;
      if (scrollLocks === 0) {
        document.body.style.overflow = previousOverflow ?? "";
        previousOverflow = null;
      }
    };
  }, [open]);
}

export interface ModalProps {
  /** Whether the dialog is open. `false` renders nothing. */
  open: boolean;
  /** Backdrop click, and Escape unless `closeOnEscape` is false. */
  onClose: () => void;
  /**
   * Escape policy. Defaults to true; a modal that must only be dismissed by its
   * own control passes false — the stack still stops its parent from acting.
   */
  closeOnEscape?: boolean;
  /** Backdrop-click policy. Defaults to true. */
  closeOnOverlayClick?: boolean;
  /** `id` of the element labelling the dialog (usually the header `<h2>`). */
  labelledBy?: string;
  /** `aria-label`, for a dialog with no visible heading. */
  label?: string;
  /** `aria-describedby`, for a dialog whose supporting copy is elsewhere. */
  describedBy?: string;
  /** The overlay element's class list — the skin, not the scaffold. */
  overlayClassName: string;
  /** The panel element's class list. */
  contentClassName: string;
  /** Rendered inside the panel. */
  children: ReactNode;
}

export default function Modal({
  open,
  onClose,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  labelledBy,
  label,
  describedBy,
  overlayClassName,
  contentClassName,
  children,
}: ModalProps) {
  const trapRef = useFocusTrap(open);
  useEscapeStack(open, closeOnEscape ? onClose : undefined);
  useScrollLock(open);

  if (!open) return null;

  return (
    <div
      className={overlayClassName}
      ref={trapRef}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={contentClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={label}
        aria-describedby={describedBy}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
