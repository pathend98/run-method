"use client";

import { useEffect, useId, type ReactNode } from "react";

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
  dismissLabel: string;
  eyebrow?: string;
  footerActions?: ModalAction[];
  headerActions?: ModalAction[];
  isBusy?: boolean;
  onClose: () => void;
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
  dismissLabel,
  eyebrow,
  footerActions = [],
  headerActions = [],
  isBusy = false,
  onClose,
  size = "medium",
  title,
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBusy) onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isBusy, onClose]);

  function renderAction(action: ModalAction, placement: "header" | "footer") {
    return (
      <button
        aria-label={action.ariaLabel}
        className={`rounded-md ${
          placement === "header" ? "px-3 py-1" : "px-3 py-2"
        } text-sm disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${actionClasses[action.variant]}`}
        disabled={isBusy || action.disabled}
        form={action.form}
        key={`${placement}-${action.label}`}
        onClick={action.onClick}
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
            headerActions.length > 1
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
          {headerActions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {headerActions.map((action) => renderAction(action, "header"))}
            </div>
          ) : null}
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
