"use client";

import { useEffect } from "react";
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
  const setModalOperations = useTrainingPlannerStore(
    (state) => state.setModalOperations,
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
  const { isPending: isCreatingActivity, mutateAsync: createActivity } =
    createMutation;
  const { isPending: isEditingActivity, mutateAsync: editActivity } =
    editMutation;
  const { isPending: isDeletingActivity, mutateAsync: deleteActivity } =
    deleteMutation;
  const { isPending: isSkippingActivity, mutateAsync: skipActivity } =
    skipMutation;
  const { isPending: isCompletingActivity, mutateAsync: completeActivity } =
    completeMutation;

  useEffect(() => {
    setModalOperations({
      createActivity,
      editActivity: (id, request) => editActivity({ id, request }),
      deleteActivity,
      skipActivity: (id, request) => skipActivity({ id, request }),
      completeActivity: (id, request) => completeActivity({ id, request }),
      isCreatingActivity,
      isEditingActivity,
      isDeletingActivity,
      isTransitioningActivity: isSkippingActivity || isCompletingActivity,
    });
  }, [
    completeActivity,
    createActivity,
    deleteActivity,
    editActivity,
    isCompletingActivity,
    isCreatingActivity,
    isDeletingActivity,
    isEditingActivity,
    isSkippingActivity,
    setModalOperations,
    skipActivity,
  ]);

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
        <ActivityDetailsModal />
      ) : null}
      {activeModalKind === "edit" ? (
        <EditActivityModal />
      ) : null}
      {activeModalKind === "add" ? (
        <AddActivityModal />
      ) : null}
    </>
  );
}
