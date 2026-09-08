"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { fetchTrainingSessions } from "@/ui/training-sessions/training-sessions-api-client";
import { Button } from "@/ui/components/button";
import { PlannerStatus } from "./components/planner-status";
import { TrainingPlannerView } from "./components/training-planner-view";
import { ActivityDetailsModal } from "@/ui/activity-details/activity-details-modal";
import { AddActivityModal } from "@/ui/add-activity/add-activity-modal";
import { EditActivityModal } from "@/ui/edit-activity/edit-activity-modal";
import { CompleteActivityModal } from "@/ui/complete-activity/complete-activity-modal";
import { SkipActivityModal } from "@/ui/skip-activity/skip-activity-modal";
import { DeleteActivityModal } from "@/ui/delete-activity/delete-activity-modal";
import { ReviewActivitiesModal } from "@/ui/review-activities/review-activities-modal";
import { MoveActivityModal } from "@/ui/move-activity/move-activity-modal";
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
  if (query.isPending) {
    return <PlannerStatus message="Loading training planner..." />;
  }

  if (query.isError) {
    return (
      <PlannerStatus
        action={
          <Button onClick={() => void query.refetch()} variant="primary">
            Retry
          </Button>
        }
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
        onPreviousWeek={() =>
          navigateToWeek(getAdjacentWeekStart(weekRange, -1))
        }
        onAddActivity={openAddActivity}
        onSelectActivity={openActivityDetails}
        sessions={query.data}
        week={week}
        weekRange={weekRange}
      />
      {activeModalKind === "details" ? <ActivityDetailsModal /> : null}
      {activeModalKind === "edit" ? <EditActivityModal /> : null}
      {activeModalKind === "move" ? <MoveActivityModal /> : null}
      {activeModalKind === "complete" ? <CompleteActivityModal /> : null}
      {activeModalKind === "skip" ? <SkipActivityModal /> : null}
      {activeModalKind === "delete" ? <DeleteActivityModal /> : null}
      {activeModalKind === "add" ? <AddActivityModal /> : null}
      {activeModalKind === "review" ? <ReviewActivitiesModal /> : null}
    </>
  );
}
