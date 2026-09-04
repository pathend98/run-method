import type { ReactNode } from "react";

type PlannerStatusProps = {
  action?: ReactNode;
  message: string;
};

export function PlannerStatus({ action, message }: PlannerStatusProps) {
  return (
    <section
      aria-live="polite"
      className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8"
    >
      <h1 className="text-3xl font-semibold text-zinc-950 sm:text-4xl">
        Training Plan
      </h1>
      <p className="text-sm text-zinc-600">{message}</p>
      {action}
    </section>
  );
}
