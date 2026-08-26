"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTrainingSession,
  fetchTrainingSessions,
} from "@/ui/training-sessions/training-sessions";
import type { CreateTrainingSessionRequest } from "@/domain/training-sessions";
import { PlannerStatus } from "./components/planner-status";
import { TrainingPlannerView } from "./components/training-planner-view";
import {
  getCurrentWeekRange,
  groupSessionsByWeekday,
} from "./services/training-planner-service";

export function TrainingPlanner() {
  const queryClient = useQueryClient();
  const weekRange = getCurrentWeekRange();
  const queryKey = ["training-sessions", weekRange.from, weekRange.to];
  const query = useQuery({
    queryKey,
    queryFn: () => fetchTrainingSessions(weekRange),
  });
  const createMutation = useMutation({
    mutationFn: createTrainingSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
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

  const week = groupSessionsByWeekday(query.data, weekRange);

  return (
    <TrainingPlannerView
      isCreatingActivity={createMutation.isPending}
      onCreateActivity={(request: CreateTrainingSessionRequest) =>
        createMutation.mutateAsync(request)
      }
      week={week}
    />
  );
}
