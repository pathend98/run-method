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
import { Button } from "../button/button";

export type ModalAction = {
  ariaLabel?: string;
  disabled?: boolean;
  form?: string;
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant: "primary" | "secondary" | "tertiary" | "warning" | "destructive";
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
  subtitle?: string;
  title: string;
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
  subtitle,
  title,
}: ModalProps) {
  const titleId = useId();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const actionMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const headerActions = [...primaryHeaderActions, ...secondaryHeaderActions];

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBusy) onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isBusy, onClose]);

  useEffect(() => {
    if (!isActionMenuOpen) {
      return;
    }

    function closeOnOutsidePointerDown(event: PointerEvent) {
      if (!actionMenuRef.current?.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
  }, [isActionMenuOpen]);

  function closeActionMenu() {
    setIsActionMenuOpen(false);
  }

  function closeActionMenuAndReturnFocus() {
    closeActionMenu();
    actionMenuTriggerRef.current?.focus();
  }

  function handleActionMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeActionMenuAndReturnFocus();
    }
  }

  function renderAction(
    action: ModalAction,
    placement: "header" | "footer" | "menu",
  ) {
    return (
      <Button
        aria-label={action.ariaLabel}
        className={placement === "menu" ? "w-full justify-start" : undefined}
        disabled={isBusy || action.disabled}
        form={action.form}
        key={`${placement}-${action.label}`}
        onClick={() => {
          if (placement === "menu") {
            closeActionMenu();
          }
          action.onClick?.();
        }}
        role={placement === "menu" ? "menuitem" : undefined}
        size="default"
        type={action.type ?? "button"}
        variant={action.variant}
      >
        {action.label}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6">
      <button
        aria-label={dismissLabel}
        className="absolute inset-0 bg-zinc-950/30"
        disabled={isBusy}
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={`fixed inset-0 z-10 flex h-dvh w-full max-w-none flex-col overflow-y-auto rounded-none bg-white shadow-none sm:relative sm:inset-auto sm:h-auto sm:max-h-[calc(100dvh-3rem)] ${
          size === "large" ? "sm:max-w-4xl" : "sm:max-w-xl"
        } sm:rounded-xl sm:p-6 sm:shadow-xl`}
        role="dialog"
      >
        <div className="sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-zinc-200 bg-white p-4 sm:static sm:z-auto sm:border-b-0 sm:p-0">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                {eyebrow}
              </p>
            ) : null}
            <h2
              className="break-words text-xl font-semibold text-zinc-950"
              id={titleId}
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-nowrap items-start gap-2">
            {primaryHeaderActions.map((action) => (
              <div className="hidden sm:block" key={`header-${action.label}`}>
                {renderAction(action, "header")}
              </div>
            ))}
            {headerActions.length > 0 ? (
              <div
                className={`relative${secondaryHeaderActions.length === 0 ? " sm:hidden" : ""}`}
                ref={actionMenuRef}
              >
                <Button
                  aria-controls={
                    isActionMenuOpen ? "modal-header-actions" : undefined
                  }
                  aria-expanded={isActionMenuOpen}
                  aria-haspopup="menu"
                  aria-label="More actions"
                  disabled={isBusy}
                  onClick={() => setIsActionMenuOpen((open) => !open)}
                  ref={actionMenuTriggerRef}
                  size="icon"
                  type="button"
                  variant="tertiary"
                >
                  <Ellipsis aria-hidden="true" className="size-4" />
                </Button>
                {isActionMenuOpen ? (
                  <div
                    className="absolute right-0 z-20 mt-2 flex w-44 flex-col gap-2 rounded-md border border-zinc-200 bg-white p-1 shadow-lg"
                    id="modal-header-actions"
                    onKeyDown={handleActionMenuKeyDown}
                    role="menu"
                  >
                    {primaryHeaderActions.map((action) => (
                      <div
                        className="sm:hidden"
                        key={`mobile-menu-${action.label}`}
                      >
                        {renderAction(action, "menu")}
                      </div>
                    ))}
                    {secondaryHeaderActions.map((action) =>
                      renderAction(action, "menu"),
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
            <Button
              aria-label={closeLabel}
              disabled={isBusy}
              onClick={onClose}
              size="icon"
              type="button"
              variant="tertiary"
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 px-4 pb-4 sm:px-0 sm:pb-0">{children}</div>

        {footerActions.length > 0 ? (
          <div className="sticky bottom-0 z-20 mt-auto flex justify-end gap-3 border-t border-zinc-200 bg-white p-4 sm:static sm:z-auto sm:mt-4 sm:p-0 sm:pt-4">
            {footerActions.map((action) => renderAction(action, "footer"))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
