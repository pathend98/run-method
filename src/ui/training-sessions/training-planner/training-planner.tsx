"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { fetchTrainingSessions } from "@/ui/training-sessions/api";
import { useCurrentUserQuery } from "@/ui/users/current-user-query";
import { DistanceDisplayProvider } from "@/ui/users/measurement-unit-context";
import { Button } from "@/ui/shared/button/button";
import { PlannerStatus } from "./presentation/planner-status";
import { TrainingPlannerView } from "./presentation/training-planner-view";
import { TrainingSessionDetailsModal } from "@/ui/training-sessions/training-session-details";
import { AddTrainingSessionModal } from "@/ui/training-sessions/add-training-session";
import { EditTrainingSessionModal } from "@/ui/training-sessions/edit-training-session";
import { CompleteTrainingSessionModal } from "@/ui/training-sessions/complete-training-session";
import { SkipTrainingSessionModal } from "@/ui/training-sessions/skip-training-session";
import { DeleteTrainingSessionModal } from "@/ui/training-sessions/delete-training-session";
import { ReviewTrainingSessionsModal } from "@/ui/training-sessions/review-training-sessions";
import { MoveTrainingSessionModal } from "@/ui/training-sessions/move-training-session";
import {
  getAdjacentWeekStart,
  getCurrentWeekRange,
  resolveWeekRange,
} from "./calendar/week-range";
import { groupSessionsByWeekday } from "./calendar/group-sessions-by-weekday";
import { useTrainingSessionDialogsStore } from "@/ui/training-sessions/training-session-dialogs";
import { createMoveTrainingSessionRequest } from "@/ui/training-sessions/move-training-session";
import { useEditTrainingSessionMutation } from "@/ui/training-sessions/mutations";
import type { TrainingSessionMoveDestination } from "@/ui/training-sessions/move-training-session";
import type { PlannerTrainingSession } from "./calendar/training-calendar-types";

export function TrainingPlanner() {
  const openAddTrainingSession = useTrainingSessionDialogsStore(
    (state) => state.openAddTrainingSession,
  );
  const openTrainingSessionDetails = useTrainingSessionDialogsStore(
    (state) => state.openTrainingSessionDetails,
  );
  const activeModalKind = useTrainingSessionDialogsStore(
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

  async function moveTrainingSession(
    trainingSession: PlannerTrainingSession,
    destination: TrainingSessionMoveDestination,
  ) {
    await editMutation.mutateAsync({
      id: trainingSession.id,
      request: createMoveTrainingSessionRequest(trainingSession, destination),
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
        onMoveTrainingSession={moveTrainingSession}
        onNextWeek={() => navigateToWeek(getAdjacentWeekStart(weekRange, 1))}
        onPreviousWeek={() =>
          navigateToWeek(getAdjacentWeekStart(weekRange, -1))
        }
        onAddTrainingSession={(day) => openAddTrainingSession(day.date)}
        onSelectTrainingSession={openTrainingSessionDetails}
        sessions={query.data}
        week={week}
        weekRange={weekRange}
      />
      {activeModalKind === "details" ? <TrainingSessionDetailsModal /> : null}
      {activeModalKind === "edit" ? <EditTrainingSessionModal /> : null}
      {activeModalKind === "move" ? <MoveTrainingSessionModal /> : null}
      {activeModalKind === "complete" ? <CompleteTrainingSessionModal /> : null}
      {activeModalKind === "skip" ? <SkipTrainingSessionModal /> : null}
      {activeModalKind === "delete" ? <DeleteTrainingSessionModal /> : null}
      {activeModalKind === "add" ? (
        <AddTrainingSessionModal athleteId={currentUser.data.id} />
      ) : null}
      {activeModalKind === "review" ? <ReviewTrainingSessionsModal /> : null}
    </DistanceDisplayProvider>
  );
}
