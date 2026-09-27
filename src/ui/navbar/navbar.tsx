"use client";

import { CalendarDays, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/ui/components/button";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const triggerId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const logoutRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    logoutRef.current!.focus();

    function dismissOutside(event: PointerEvent) {
      if (!containerRef.current!.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <Link
          aria-label="Training planner"
          className="inline-flex size-11 items-center justify-center rounded-md text-teal-700 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          href="/training-planner"
        >
          <CalendarDays aria-hidden="true" className="size-5" />
        </Link>
        <div
          className="relative"
          ref={containerRef}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsOpen(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && isOpen) {
              event.preventDefault();
              event.stopPropagation();
              setIsOpen(false);
              triggerRef.current!.focus();
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setIsOpen(true);
              if (isOpen) logoutRef.current!.focus();
            }
          }}
        >
          <Button
            aria-controls={isOpen ? menuId : undefined}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            aria-label="User menu"
            className="min-h-11 min-w-11"
            id={triggerId}
            onClick={() => setIsOpen((open) => !open)}
            ref={triggerRef}
            size="icon"
            variant="tertiary"
          >
            <UserRound aria-hidden="true" className="size-5" />
          </Button>
          {isOpen ? (
            <div
              aria-labelledby={triggerId}
              className="absolute right-0 mt-2 w-44 max-w-[calc(100vw-2rem)] rounded-md border border-zinc-200 bg-white p-1 shadow-lg"
              id={menuId}
              role="menu"
            >
              <a
                className="flex min-h-11 items-center rounded px-3 text-sm text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-teal-600"
                href="/auth/logout"
                ref={logoutRef}
                role="menuitem"
                tabIndex={-1}
              >
                Log out
              </a>
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
