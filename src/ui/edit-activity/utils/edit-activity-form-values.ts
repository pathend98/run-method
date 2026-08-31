import type { TrainingSession } from "@/domain/training-sessions";
import { formatPace } from "@/ui/training-sessions/training-session-metric-formatters";
import type { EditActivityFormValues } from "./edit-activity-form-schema";

export function getEditActivityFormValues(
  activity: TrainingSession,
): EditActivityFormValues {
  const values: EditActivityFormValues = {
    title: activity.title,
    timeOfDay: activity.timeOfDay ?? "ANY",
    description: activity.description ?? "",
    distanceKilometres: "",
    durationMinutes: "",
    pacePerKilometre: "",
  };

  if (activity.activityType === "STRENGTH") return values;

  return {
    ...values,
    distanceKilometres:
      activity.targetDistanceMetres === null
        ? ""
        : String(activity.targetDistanceMetres / 1000),
    durationMinutes:
      activity.targetDurationSeconds === null
        ? ""
        : String(activity.targetDurationSeconds / 60),
    pacePerKilometre:
      activity.targetPaceSecondsPerKilometre === null
        ? ""
        : formatPace(activity.targetPaceSecondsPerKilometre, {
            includeUnit: false,
          }),
  };
}
