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
import { AddTrainingSessionModal } from "@/ui/training-sessions/add-training-session/add-training-session-modal";
import { EditActivityModal } from "@/ui/training-sessions/edit-activity/edit-activity-modal";
import { CompleteActivityModal } from "@/ui/training-sessions/complete-activity/complete-activity-modal";
import { SkipTrainingSessionModal } from "@/ui/training-sessions/skip-training-session/skip-training-session-modal";
import { DeleteTrainingSessionModal } from "@/ui/training-sessions/delete-training-session/delete-training-session-modal";
import { ReviewTrainingSessionsModal } from "@/ui/training-sessions/review-training-sessions/review-training-sessions-modal";
import { MoveTrainingSessionModal } from "@/ui/training-sessions/move-training-session/move-training-session-modal";
import {
  getAdjacentWeekStart,
  getCurrentWeekRange,
  groupSessionsByWeekday,
  resolveWeekRange,
} from "./services/training-planner-service";
import { useTrainingPlannerStore } from "./training-planner-store";
import { createMoveTrainingSessionRequest } from "@/ui/training-sessions/move-training-session/create-move-training-session-request";
import { useEditTrainingSessionMutation } from "@/ui/training-sessions/mutations/training-session-mutations";
import type { TrainingSessionMoveDestination } from "@/ui/training-sessions/move-training-session/create-move-training-session-request";
import type { TrainingActivity } from "./types/training-planner-types";

export function TrainingPlanner() {
  const openAddTrainingSession = useTrainingPlannerStore(
    (state) => state.openAddTrainingSession,
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
        onAddTrainingSession={openAddTrainingSession}
        onSelectActivity={openActivityDetails}
        sessions={query.data}
        week={week}
        weekRange={weekRange}
      />
      {activeModalKind === "details" ? <TrainingSessionDetailsModal /> : null}
      {activeModalKind === "edit" ? <EditActivityModal /> : null}
      {activeModalKind === "move" ? <MoveTrainingSessionModal /> : null}
      {activeModalKind === "complete" ? <CompleteActivityModal /> : null}
      {activeModalKind === "skip" ? <SkipTrainingSessionModal /> : null}
      {activeModalKind === "delete" ? <DeleteTrainingSessionModal /> : null}
      {activeModalKind === "add" ? (
        <AddTrainingSessionModal athleteId={currentUser.data.id} />
      ) : null}
      {activeModalKind === "review" ? <ReviewTrainingSessionsModal /> : null}
    </DistanceDisplayProvider>
  );
}
