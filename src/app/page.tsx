import { Suspense } from "react";

import { QueryProvider } from "./query-provider";
import { TrainingPlanner } from "@/ui/training-planner/training-planner";

export default function Home() {
  return (
    <main>
      <QueryProvider>
        <Suspense
          fallback={
            <section
              aria-live="polite"
              className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8"
            >
              <h1 className="text-3xl font-semibold text-zinc-950 sm:text-4xl">
                Training planner
              </h1>
              <p className="text-sm text-zinc-600">
                Loading training planner...
              </p>
            </section>
          }
        >
          <TrainingPlanner />
        </Suspense>
      </QueryProvider>
    </main>
  );
}
