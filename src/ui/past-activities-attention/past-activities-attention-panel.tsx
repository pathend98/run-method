"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";

import { Button } from "@/ui/components/button";
import { fetchTrainingSessions } from "@/ui/training-sessions/training-sessions-api-client";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";
import { useCurrentUserQuery } from "@/ui/users/current-user-query";

type PastActivitiesAttentionPanelProps = {
  className?: string;
};

export function PastActivitiesAttentionPanel({
  className,
}: PastActivitiesAttentionPanelProps) {
  const openReviewActivities = useTrainingPlannerStore(
    (state) => state.openReviewActivities,
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
  });

  if (query.isPending || query.isError || !query.data?.length) return null;

  const count = query.data.length;
  const activityLabel = count === 1 ? "activity" : "activities";
  const verb = count === 1 ? "needs" : "need";

  return (
    <section
      aria-label="Activities requiring attention"
      className={`flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between${className ? ` ${className}` : ""}`}
    >
      <div>
        <h2 className="text-sm font-semibold text-amber-950">
          {count} {activityLabel} {verb} your attention.
        </h2>
        <p className="text-sm text-amber-900">
          Past activities are waiting to be completed.
        </p>
      </div>
      <Button onClick={openReviewActivities} size="compact" variant="warning">
        Review activities
      </Button>
    </section>
  );
}
