import { format } from "date-fns";

import type { TrainingSession } from "@/domain/training-sessions";

export function canTransitionActivity(
  activity: TrainingSession,
  now = new Date(),
): boolean {
  return (
    activity.status === "SCHEDULED" &&
    activity.date <= format(now, "yyyy-MM-dd")
  );
}
