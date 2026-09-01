"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  createTrainingSession,
  deleteTrainingSession,
  editTrainingSession,
  fetchTrainingSessions,
} from "@/ui/training-sessions/training-sessions-api-client";
import type {
  CreateTrainingSessionRequest,
  EditTrainingSessionRequest,
} from "@/domain/training-sessions";
import { PlannerStatus } from "./components/planner-status";
import { TrainingPlannerView } from "./components/training-planner-view";
import {
  getAdjacentWeekStart,
  getCurrentWeekRange,
  groupSessionsByWeekday,
  resolveWeekRange,
} from "./services/training-planner-service";

export function TrainingPlanner() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentWeekRange = getCurrentWeekRange();
  const weekRange = resolveWeekRange(searchParams.get("week"));
  const queryKey = ["training-sessions", weekRange.from, weekRange.to];
  const query = useQuery({
    queryKey,
    queryFn: () => fetchTrainingSessions(weekRange),
  });

  function navigateToWeek(weekStart: string | null) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());

    if (weekStart) {
      nextSearchParams.set("week", weekStart);
    } else {
      nextSearchParams.delete("week");
    }

    const queryString = nextSearchParams.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }
  const createMutation = useMutation({
    mutationFn: createTrainingSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });
  const editMutation = useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: string;
      request: EditTrainingSessionRequest;
    }) => editTrainingSession(id, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteTrainingSession,
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
      isCurrentWeek={weekRange.from === currentWeekRange.from}
      isCreatingActivity={createMutation.isPending}
      isDeletingActivity={deleteMutation.isPending}
      isEditingActivity={editMutation.isPending}
      onCreateActivity={(request: CreateTrainingSessionRequest) =>
        createMutation.mutateAsync(request)
      }
      onCurrentWeek={() => navigateToWeek(null)}
      onDeleteActivity={(id) => deleteMutation.mutateAsync(id)}
      onEditActivity={(id, request) =>
        editMutation.mutateAsync({ id, request })
      }
      onNextWeek={() => navigateToWeek(getAdjacentWeekStart(weekRange, 1))}
      onPreviousWeek={() => navigateToWeek(getAdjacentWeekStart(weekRange, -1))}
      week={week}
      weekRange={weekRange}
    />
  );
}
