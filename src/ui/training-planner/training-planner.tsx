"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { fetchTrainingSessions } from "@/ui/training-sessions/api/training-sessions-api-client";
import { useCurrentUserQuery } from "@/ui/users/current-user-query";
import { DistanceDisplayProvider } from "@/ui/users/measurement-unit-context";
import { Button } from "@/ui/shared/button/button";
import { PlannerStatus } from "./components/planner-status";
import { TrainingPlannerView } from "./components/training-planner-view";
import { TrainingSessionDetailsModal } from "@/ui/training-sessions/training-session-details/training-session-details-modal";
import { AddActivityModal } from "@/ui/training-sessions/add-activity/add-activity-modal";
import { EditActivityModal } from "@/ui/training-sessions/edit-activity/edit-activity-modal";
import { CompleteActivityModal } from "@/ui/training-sessions/complete-activity/complete-activity-modal";
import { SkipActivityModal } from "@/ui/training-sessions/skip-activity/skip-activity-modal";
import { DeleteActivityModal } from "@/ui/training-sessions/delete-activity/delete-activity-modal";
import { ReviewTrainingSessionsModal } from "@/ui/training-sessions/review-training-sessions/review-training-sessions-modal";
import { MoveActivityModal } from "@/ui/training-sessions/move-activity/move-activity-modal";
import {
  getAdjacentWeekStart,
  getCurrentWeekRange,
  groupSessionsByWeekday,
  resolveWeekRange,
} from "./services/training-planner-service";
import { useTrainingPlannerStore } from "./training-planner-store";
import { createMoveTrainingSessionRequest } from "@/ui/training-sessions/move-activity";
import { useEditTrainingSessionMutation } from "@/ui/training-sessions/mutations/training-session-mutations";
import type { TrainingSessionMoveDestination } from "@/ui/training-sessions/move-activity/create-move-training-session-request";
import type { TrainingActivity } from "./types/training-planner-types";

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
  const editMutation = useEditTrainingSessionMutation();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentWeekRange = getCurrentWeekRange();
  const weekRange = resolveWeekRange(searchParams.get("week"));
  const currentUser = useCurrentUserQuery();
  const athleteId = currentUser.data?.id;
  const queryKey = [
    "training-sessions",
    athleteId,
    weekRange.from,
    weekRange.to,
  ];
  const query = useQuery({
    queryKey,
    queryFn: athleteId
      ? () => fetchTrainingSessions(athleteId, weekRange)
      : skipToken,
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

  async function moveActivity(
    activity: TrainingActivity,
    destination: TrainingSessionMoveDestination,
  ) {
    await editMutation.mutateAsync({
      id: activity.id,
      request: createMoveTrainingSessionRequest(activity, destination),
    });
  }
  if (currentUser.isError || query.isError) {
    return (
      <PlannerStatus
        action={
          <Button
            onClick={() =>
              void (currentUser.isError
                ? currentUser.refetch()
                : query.refetch())
            }
            variant="primary"
          >
            Retry
          </Button>
        }
        message="Unable to load training planner."
      />
    );
  }

  if (currentUser.isPending || query.isPending) {
    return <PlannerStatus message="Loading training planner..." />;
  }

  const week = groupSessionsByWeekday(query.data, weekRange);

  return (
    <DistanceDisplayProvider measurementUnit={currentUser.data.measurementUnit}>
      <TrainingPlannerView
        isCurrentWeek={weekRange.from === currentWeekRange.from}
        onCurrentWeek={() => navigateToWeek(null)}
        onMoveActivity={moveActivity}
        onNextWeek={() => navigateToWeek(getAdjacentWeekStart(weekRange, 1))}
        onPreviousWeek={() =>
          navigateToWeek(getAdjacentWeekStart(weekRange, -1))
        }
        onAddActivity={openAddActivity}
        onSelectActivity={openActivityDetails}
        sessions={query.data}
        week={week}
        weekRange={weekRange}
      />
      {activeModalKind === "details" ? <TrainingSessionDetailsModal /> : null}
      {activeModalKind === "edit" ? <EditActivityModal /> : null}
      {activeModalKind === "move" ? <MoveActivityModal /> : null}
      {activeModalKind === "complete" ? <CompleteActivityModal /> : null}
      {activeModalKind === "skip" ? <SkipActivityModal /> : null}
      {activeModalKind === "delete" ? <DeleteActivityModal /> : null}
      {activeModalKind === "add" ? (
        <AddActivityModal athleteId={currentUser.data.id} />
      ) : null}
      {activeModalKind === "review" ? <ReviewTrainingSessionsModal /> : null}
    </DistanceDisplayProvider>
  );
}
