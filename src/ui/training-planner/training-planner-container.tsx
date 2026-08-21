"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { fetchTrainingSessions } from "@/ui/training-sessions/training-sessions-client";
import { TrainingPlanner } from "./training-planner";
import {
  getCurrentWeekRange,
  groupSessionsByWeekday,
} from "./training-planner-service";

export function TrainingPlannerContainer() {
  const weekRange = getCurrentWeekRange();
  const query = useQuery({
    queryKey: ["training-sessions", weekRange.from, weekRange.to],
    queryFn: () => fetchTrainingSessions(weekRange),
  });

  if (query.isPending) {
    return <PlannerStatus message="Loading training planner..." />;
  }

  if (query.isError) {
    return (
      <PlannerStatus
        action={<button onClick={() => void query.refetch()}>Retry</button>}
        message="Unable to load training planner."
      />
    );
  }

  const week = groupSessionsByWeekday(query.data);

  return <TrainingPlanner week={week} />;
}

type PlannerStatusProps = {
  action?: ReactNode;
  message: string;
};

function PlannerStatus({ action, message }: PlannerStatusProps) {
  return (
    <section
      aria-live="polite"
      className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8"
    >
      <h1 className="text-3xl font-semibold text-zinc-950 sm:text-4xl">
        Training planner
      </h1>
      <p className="text-sm text-zinc-600">{message}</p>
      {action}
    </section>
  );
}
