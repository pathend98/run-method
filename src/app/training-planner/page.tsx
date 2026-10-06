import { Suspense } from "react";

import { TrainingPlanner } from "@/ui/training-sessions/training-planner";
import { TrainingSessionDialogsStoreProvider } from "@/ui/training-sessions/training-session-dialogs";

export default function TrainingPlannerPage() {
  return (
    <main>
      <Suspense
        fallback={
          <section
            aria-live="polite"
            className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8"
          >
            <h1 className="text-2xl font-semibold text-zinc-950 sm:text-4xl">
              Training Plan
            </h1>
            <p className="text-sm text-zinc-600">Loading training planner...</p>
          </section>
        }
      >
        <TrainingSessionDialogsStoreProvider>
          <TrainingPlanner />
        </TrainingSessionDialogsStoreProvider>
      </Suspense>
    </main>
  );
}
