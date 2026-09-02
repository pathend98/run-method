"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  completeTrainingSession,
  createTrainingSession,
  deleteTrainingSession,
  editTrainingSession,
  fetchTrainingSessions,
  skipTrainingSession,
} from "@/ui/training-sessions/training-sessions-api-client";
import type {
  CompleteTrainingSessionRequest,
  CreateTrainingSessionRequest,
  EditTrainingSessionRequest,
  SkipTrainingSessionRequest,
} from "@/domain/training-sessions";
import { PlannerStatus } from "./components/planner-status";
import { TrainingPlannerView } from "./components/training-planner-view";
import { ActivityDetailsModal } from "@/ui/activity-details/activity-details-modal";
import { AddActivityModal } from "@/ui/add-activity/add-activity-modal";
import { EditActivityModal } from "@/ui/edit-activity/edit-activity-modal";
import {
  getAdjacentWeekStart,
  getCurrentWeekRange,
  groupSessionsByWeekday,
  resolveWeekRange,
} from "./services/training-planner-service";
import { useTrainingPlannerStore } from "./training-planner-store";

export function TrainingPlanner() {
  const openAddActivity = useTrainingPlannerStore(
    (state) => state.openAddActivity,
  );
  const openActivityDetails = useTrainingPlannerStore(
    (state) => state.openActivityDetails,
  );
  const activeModalKind = useTrainingPlannerStore(
    (state) => state.activeModal?.kind,
  );
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
  const skipMutation = useMutation({
    mutationFn: ({ id, request }: { id: string; request: SkipTrainingSessionRequest }) =>
      skipTrainingSession(id, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });
  const completeMutation = useMutation({
    mutationFn: ({ id, request }: { id: string; request: CompleteTrainingSessionRequest }) =>
      completeTrainingSession(id, request),
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
    <>
      <TrainingPlannerView
        isCurrentWeek={weekRange.from === currentWeekRange.from}
        onCurrentWeek={() => navigateToWeek(null)}
        onNextWeek={() => navigateToWeek(getAdjacentWeekStart(weekRange, 1))}
        onPreviousWeek={() => navigateToWeek(getAdjacentWeekStart(weekRange, -1))}
        onAddActivity={openAddActivity}
        onSelectActivity={openActivityDetails}
        week={week}
        weekRange={weekRange}
      />
      {activeModalKind === "details" ? (
        <ActivityDetailsModal
          isDeleting={deleteMutation.isPending}
          isTransitioning={skipMutation.isPending || completeMutation.isPending}
          onComplete={(id, request) =>
            completeMutation.mutateAsync({ id, request })
          }
          onDelete={(id) => deleteMutation.mutateAsync(id)}
          onSkip={(id, request) => skipMutation.mutateAsync({ id, request })}
        />
      ) : null}
      {activeModalKind === "edit" ? (
        <EditActivityModal
          isSubmitting={editMutation.isPending}
          onEdit={(id, request) => editMutation.mutateAsync({ id, request })}
        />
      ) : null}
      {activeModalKind === "add" ? (
        <AddActivityModal
          isSubmitting={createMutation.isPending}
          onCreate={(request: CreateTrainingSessionRequest) =>
            createMutation.mutateAsync(request)
          }
        />
      ) : null}
    </>
  );
}
