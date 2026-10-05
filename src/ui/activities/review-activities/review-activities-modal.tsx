"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { format, parseISO, subDays } from "date-fns";
import { useEffect } from "react";

import type { TrainingSession } from "@/domain/training-sessions";
import type { User } from "@/domain/user-types";
import { Button } from "@/ui/shared/button/button";
import { Modal } from "@/ui/shared/modal/modal";
import {
  formatCompactDuration,
  formatDistance,
} from "@/ui/activities/formatters/training-session-metric-formatters";
import { fetchTrainingSessions } from "@/ui/activities/api/training-sessions-api-client";
import { useCurrentUserQuery } from "@/ui/users/current-user-query";
import { useDistanceDisplayUnit } from "@/ui/users/measurement-unit-context";
import {
  useTrainingPlannerStore,
  type TrainingActivity,
} from "@/ui/training-planner/training-planner-store";

export function ReviewActivitiesModal() {
  const measurementUnit = useDistanceDisplayUnit();
  const activeModal = useTrainingPlannerStore((state) => state.activeModal);
  const closeModal = useTrainingPlannerStore((state) => state.closeModal);
  const openCompleteActivity = useTrainingPlannerStore(
    (state) => state.openCompleteActivityFromReview,
  );
  const openSkipActivity = useTrainingPlannerStore(
    (state) => state.openSkipActivityFromReview,
  );
  const currentUser = useCurrentUserQuery();
  const athleteId = currentUser.data?.id;
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const query = useQuery({
    queryKey: ["training-sessions", athleteId, "past-scheduled", yesterday],
    queryFn: athleteId
      ? () =>
          fetchTrainingSessions(athleteId, {
            status: "SCHEDULED",
            to: yesterday,
          })
      : skipToken,
    enabled: activeModal?.kind === "review",
  });

  useEffect(() => {
    if (activeModal?.kind === "review" && query.data?.length === 0) {
      closeModal();
    }
  }, [activeModal?.kind, closeModal, query.data?.length]);

  if (
    activeModal?.kind !== "review" ||
    query.isPending ||
    query.isError ||
    !query.data?.length
  ) {
    return null;
  }

  const activitiesByDate = groupActivitiesByDate(query.data);
  const count = query.data.length;

  return (
    <Modal
      dismissLabel="Dismiss activities requiring attention"
      closeLabel="Close activities requiring attention"
      footerActions={[
        { label: "Close", onClick: closeModal, variant: "tertiary" },
      ]}
      onClose={closeModal}
      title="Activities needing attention"
    >
      <p className="mt-2 text-sm text-zinc-600">
        {count} {count === 1 ? "activity" : "activities"} remaining.
      </p>
      <div className="mt-5 divide-y divide-zinc-200">
        {activitiesByDate.map(([date, activities]) => (
          <section
            className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 py-3"
            key={date}
          >
            <h3 className="pt-1 text-xs font-semibold tracking-wide text-zinc-600 uppercase">
              {format(parseISO(date), "EEE d MMM")}
            </h3>
            <ul className="flex min-w-0 flex-col gap-3">
              {activities.map((activity) => (
                <li
                  className="flex flex-wrap items-start justify-between gap-3"
                  key={activity.id}
                >
                  <div>
                    <p className="font-medium text-zinc-950">
                      {activity.title}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {formatPlannedMetrics(activity, measurementUnit)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        openCompleteActivity(toTrainingActivity(activity))
                      }
                      size="compact"
                      variant="primary"
                    >
                      Complete
                    </Button>
                    <Button
                      onClick={() =>
                        openSkipActivity(toTrainingActivity(activity))
                      }
                      size="compact"
                      variant="warning"
                    >
                      Skip
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}

function groupActivitiesByDate(activities: TrainingSession[]) {
  const grouped = new Map<string, TrainingSession[]>();
  for (const activity of activities) {
    grouped.set(activity.date, [
      ...(grouped.get(activity.date) ?? []),
      activity,
    ]);
  }
  return [...grouped.entries()];
}

function formatPlannedMetrics(
  activity: TrainingSession,
  measurementUnit: User["measurementUnit"],
) {
  const metrics = [
    ...(activity.activityType === "RUN"
      ? [formatDistance(activity.targetDistanceMetres, measurementUnit)]
      : []),
    formatCompactDuration(activity.targetDurationSeconds),
  ].filter((metric): metric is string => metric !== null);
  return metrics.join(" · ");
}

function toTrainingActivity(activity: TrainingSession): TrainingActivity {
  return {
    ...activity,
    day: format(parseISO(activity.date), "EEEE") as TrainingActivity["day"],
  };
}
