"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";

import { fetchTrainingSessions } from "@/ui/training-sessions/api/training-sessions-api-client";

export function useReviewTrainingSessionsQuery(
  athleteId: string | undefined,
  enabled: boolean,
) {
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  return useQuery({
    queryKey: ["training-sessions", athleteId, "past-scheduled", yesterday],
    queryFn: athleteId
      ? () =>
          fetchTrainingSessions(athleteId, {
            status: "SCHEDULED",
            to: yesterday,
          })
      : skipToken,
    enabled,
  });
}
