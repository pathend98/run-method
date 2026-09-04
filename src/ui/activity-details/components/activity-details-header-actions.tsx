import { Ellipsis, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

type ActivityDetailsHeaderActionsProps = {
  canSkip: boolean;
  disabled: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onSkip: () => void;
  onClose: () => void;
};

export function ActivityDetailsHeaderActions({
  canSkip,
  disabled,
  onClose,
  onDelete,
  onEdit,
  onSkip,
}: ActivityDetailsHeaderActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function closeOnOutsidePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
  }, [isMenuOpen]);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function closeMenuAndReturnFocus() {
    closeMenu();
    triggerRef.current?.focus();
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeMenuAndReturnFocus();
    }
  }

  function selectMenuAction(action: () => void) {
    closeMenu();
    action();
  }

  return (
    <>
      <button
        className="rounded-md bg-teal-700 px-3 py-1 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onClick={onEdit}
        type="button"
      >
        Edit activity
      </button>
      <div className="relative" ref={menuRef}>
        <button
          aria-controls={isMenuOpen ? "activity-details-actions" : undefined}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          aria-label="More activity actions"
          className="rounded-md border border-zinc-200 p-1.5 text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          onClick={() => setIsMenuOpen((open) => !open)}
          ref={triggerRef}
          type="button"
        >
          <Ellipsis aria-hidden="true" className="size-4" />
        </button>
        {isMenuOpen ? (
          <div
            className="absolute right-0 z-20 mt-2 w-44 rounded-md border border-zinc-200 bg-white p-1 shadow-lg"
            id="activity-details-actions"
            onKeyDown={handleMenuKeyDown}
            role="menu"
          >
            {canSkip ? (
              <button
                className="w-full rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-600"
                onClick={() => selectMenuAction(onSkip)}
                role="menuitem"
                type="button"
              >
                Skip activity
              </button>
            ) : null}
            <button
              className="w-full rounded px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-red-600"
              onClick={() => selectMenuAction(onDelete)}
              role="menuitem"
              type="button"
            >
              Delete activity
            </button>
          </div>
        ) : null}
      </div>
      <button
        aria-label="Close activity details"
        className="rounded-md border border-zinc-200 p-1.5 text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onClick={onClose}
        type="button"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </>
  );
}
