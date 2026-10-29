"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/ui/shared/button/button";
import { useCurrentUserQuery } from "@/ui/users/current-user-query";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const triggerId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef<HTMLAnchorElement>(null);
  const actionRef = useRef<HTMLAnchorElement>(null);
  const pathname = usePathname();
  const currentUser = useCurrentUserQuery(
    pathname === "/training-planner" ||
      pathname === "/training-goals" ||
      pathname === "/settings",
  );
  const kind = currentUser.isSuccess ? currentUser.data.kind : null;
  const userLabel = currentUser.isSuccess
    ? currentUser.data.kind === "GUEST"
      ? "Guest"
      : (currentUser.data.firstName ?? "You")
    : null;
  const actionLabel =
    kind === "GUEST" ? "Register" : kind === "REGISTERED" ? "Log out" : null;
  const actionHref = kind === "GUEST" ? "/auth" : "/auth/logout";

  useEffect(() => {
    if (!isOpen || !actionLabel) return;

    (settingsRef.current ?? actionRef.current)?.focus();

    function dismissOutside(event: PointerEvent) {
      if (!containerRef.current!.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, [isOpen, actionLabel]);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <div className="flex h-full items-stretch gap-2">
          <Link
            aria-current={pathname === "/training-planner" ? "page" : undefined}
            className="relative inline-flex min-h-11 min-w-11 items-center justify-center px-3 text-sm font-medium text-black after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 aria-[current=page]:after:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            href="/training-planner"
          >
            Schedule
          </Link>
          <Link
            aria-current={pathname === "/training-goals" ? "page" : undefined}
            className="relative inline-flex min-h-11 min-w-11 items-center justify-center px-3 text-sm font-medium text-black after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 aria-[current=page]:after:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            href="/training-goals"
          >
            Goals
          </Link>
        </div>
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
              if (!isOpen) {
                setIsOpen(true);
              } else {
                const first = settingsRef.current ?? actionRef.current;
                const second = settingsRef.current ? actionRef.current : null;
                if (second && document.activeElement === first) {
                  second.focus();
                } else {
                  first?.focus();
                }
              }
            }
          }}
        >
          <Button
            aria-controls={isOpen ? menuId : undefined}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            aria-label="User menu"
            className="min-h-11 min-w-11 gap-2 px-3"
            disabled={!actionLabel}
            id={triggerId}
            onClick={() => setIsOpen((open) => !open)}
            ref={triggerRef}
            variant="tertiary"
          >
            {userLabel ? <span>{userLabel}</span> : null}
            <UserRound aria-hidden="true" className="size-5" />
          </Button>
          {isOpen && actionLabel ? (
            <div
              aria-labelledby={triggerId}
              className="absolute right-0 mt-2 w-44 max-w-[calc(100vw-2rem)] rounded-md border border-zinc-200 bg-white p-1 shadow-lg"
              id={menuId}
              role="menu"
            >
              {kind === "REGISTERED" ? (
                <Link
                  aria-current={pathname === "/settings" ? "page" : undefined}
                  className="flex min-h-11 items-center border-b-2 border-transparent px-3 text-sm text-black aria-[current=page]:border-teal-700 focus-visible:outline-2 focus-visible:outline-teal-600"
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  ref={settingsRef}
                  role="menuitem"
                  tabIndex={-1}
                >
                  Settings
                </Link>
              ) : null}
              <a
                className="flex min-h-11 items-center rounded px-3 text-sm text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-teal-600"
                href={actionHref}
                ref={actionRef}
                role="menuitem"
                tabIndex={-1}
              >
                {actionLabel}
              </a>
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
