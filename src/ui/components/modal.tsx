"use client";

import { Ellipsis, X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";

export type ModalAction = {
  ariaLabel?: string;
  disabled?: boolean;
  form?: string;
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant: "primary" | "secondary" | "danger" | "danger-outline";
};

type ModalProps = {
  children: ReactNode;
  closeLabel?: string;
  dismissLabel: string;
  eyebrow?: string;
  footerActions?: ModalAction[];
  isBusy?: boolean;
  onClose: () => void;
  primaryHeaderActions?: ModalAction[];
  secondaryHeaderActions?: ModalAction[];
  size?: "medium" | "large";
  title: string;
};

const actionClasses: Record<ModalAction["variant"], string> = {
  primary:
    "bg-teal-700 font-semibold text-white hover:bg-teal-800 focus-visible:outline-teal-600",
  secondary:
    "border border-zinc-200 font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-teal-600",
  danger:
    "bg-red-700 font-semibold text-white hover:bg-red-800 focus-visible:outline-red-600",
  "danger-outline":
    "border border-red-300 font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-red-600",
};

export function Modal({
  children,
  closeLabel = "Close modal",
  dismissLabel,
  eyebrow,
  footerActions = [],
  isBusy = false,
  onClose,
  primaryHeaderActions = [],
  secondaryHeaderActions = [],
  size = "medium",
  title,
}: ModalProps) {
  const titleId = useId();
  const [isSecondaryMenuOpen, setIsSecondaryMenuOpen] = useState(false);
  const secondaryMenuRef = useRef<HTMLDivElement>(null);
  const secondaryMenuTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBusy) onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isBusy, onClose]);

  useEffect(() => {
    if (!isSecondaryMenuOpen) {
      return;
    }

    function closeOnOutsidePointerDown(event: PointerEvent) {
      if (!secondaryMenuRef.current?.contains(event.target as Node)) {
        setIsSecondaryMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
  }, [isSecondaryMenuOpen]);

  function closeSecondaryMenu() {
    setIsSecondaryMenuOpen(false);
  }

  function closeSecondaryMenuAndReturnFocus() {
    closeSecondaryMenu();
    secondaryMenuTriggerRef.current?.focus();
  }

  function handleSecondaryMenuKeyDown(
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeSecondaryMenuAndReturnFocus();
    }
  }

  function renderAction(
    action: ModalAction,
    placement: "header" | "footer" | "secondary-menu",
  ) {
    return (
      <button
        aria-label={action.ariaLabel}
        className={`rounded-md ${
          placement === "header" ? "px-3 py-1" : "px-3 py-2"
        } ${
          placement === "secondary-menu" ? "w-full text-left" : ""
        } text-sm disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${actionClasses[action.variant]}`}
        disabled={isBusy || action.disabled}
        form={action.form}
        key={`${placement}-${action.label}`}
        onClick={() => {
          if (placement === "secondary-menu") {
            closeSecondaryMenu();
          }
          action.onClick?.();
        }}
        role={placement === "secondary-menu" ? "menuitem" : undefined}
        type={action.type ?? "button"}
      >
        {action.label}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        aria-label={dismissLabel}
        className="absolute inset-0 cursor-default bg-zinc-950/30"
        disabled={isBusy}
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={`relative z-10 max-h-[calc(100dvh-2rem)] w-full ${
          size === "large" ? "max-w-4xl" : "max-w-xl"
        } overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-3rem)] sm:p-6`}
        role="dialog"
      >
        <div
          className={
            primaryHeaderActions.length > 1
              ? "flex flex-col items-start justify-between gap-3 sm:flex-row"
              : "flex items-start justify-between gap-3"
          }
        >
          <div>
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="text-xl font-semibold text-zinc-950" id={titleId}>
              {title}
            </h2>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            {primaryHeaderActions.map((action) =>
              renderAction(action, "header"),
            )}
            {secondaryHeaderActions.length > 0 ? (
              <div className="relative" ref={secondaryMenuRef}>
                <button
                  aria-controls={
                    isSecondaryMenuOpen ? "modal-secondary-actions" : undefined
                  }
                  aria-expanded={isSecondaryMenuOpen}
                  aria-haspopup="menu"
                  aria-label="More actions"
                  className="rounded-md border border-zinc-200 p-1.5 text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isBusy}
                  onClick={() => setIsSecondaryMenuOpen((open) => !open)}
                  ref={secondaryMenuTriggerRef}
                  type="button"
                >
                  <Ellipsis aria-hidden="true" className="size-4" />
                </button>
                {isSecondaryMenuOpen ? (
                  <div
                    className="absolute right-0 z-20 mt-2 flex w-44 flex-col gap-2 rounded-md border border-zinc-200 bg-white p-1 shadow-lg"
                    id="modal-secondary-actions"
                    onKeyDown={handleSecondaryMenuKeyDown}
                    role="menu"
                  >
                    {secondaryHeaderActions.map((action) =>
                      renderAction(action, "secondary-menu"),
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
            <button
              aria-label={closeLabel}
              className="rounded-md border border-zinc-200 p-1.5 text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              onClick={onClose}
              type="button"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>

        {children}

        {footerActions.length > 0 ? (
          <div className="mt-4 flex justify-end gap-3 border-t border-zinc-200 pt-4">
            {footerActions.map((action) => renderAction(action, "footer"))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
