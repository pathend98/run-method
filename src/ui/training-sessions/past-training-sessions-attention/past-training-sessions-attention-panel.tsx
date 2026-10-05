"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";

import { Button } from "@/ui/shared/button/button";
import { fetchTrainingSessions } from "../api";
import { useTrainingPlannerStore } from "@/ui/training-planner/training-planner-store";
import { useCurrentUserQuery } from "@/ui/users/current-user-query";

type PastTrainingSessionsAttentionPanelProps = {
  className?: string;
};

export function PastTrainingSessionsAttentionPanel({
  className,
}: PastTrainingSessionsAttentionPanelProps) {
  const openReviewTrainingSessions = useTrainingPlannerStore(
    (state) => state.openReviewTrainingSessions,
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
  const trainingSessionLabel =
    count === 1 ? "training session" : "training sessions";
  const verb = count === 1 ? "needs" : "need";

  return (
    <section
      aria-label="Training sessions requiring attention"
      className={`flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between${className ? ` ${className}` : ""}`}
    >
      <div>
        <h2 className="text-sm font-semibold text-amber-950">
          {count} {trainingSessionLabel} {verb} your attention.
        </h2>
        <p className="text-sm text-amber-900">
          Past training sessions are waiting to be completed.
        </p>
      </div>
      <Button
        onClick={openReviewTrainingSessions}
        size="compact"
        variant="warning"
      >
        Review training sessions
      </Button>
    </section>
  );
}
