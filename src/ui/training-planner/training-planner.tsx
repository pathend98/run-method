"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchTrainingSessions } from "@/ui/training-sessions/training-sessions";
import { PlannerStatus } from "./components/planner-status";
import { TrainingPlannerView } from "./components/training-planner-view";
import {
  getCurrentWeekRange,
  groupSessionsByWeekday,
} from "./services/training-planner-service";

export function TrainingPlanner() {
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

  return <TrainingPlannerView week={week} />;
}
