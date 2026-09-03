import type { TrainingSession } from "@/domain/training-sessions";
import {
  calculateDerivedMetric,
  type RunFieldMetric,
} from "@/ui/run-field-input/run-field-input";
import { durationSecondsToFields } from "@/ui/training-sessions/duration-fields";
import { formatPace } from "@/ui/training-sessions/training-session-metric-formatters";
import type { EditActivityFormValues } from "./edit-activity-form-schema";

export function getEditActivityFormValues(
  activity: TrainingSession,
): EditActivityFormValues {
  const values: EditActivityFormValues = {
    title: activity.title,
    timeOfDay: activity.timeOfDay ?? "ANY",
    description: activity.description ?? "",
    derivedMetric: null,
    distanceKilometres: "",
    ...durationSecondsToFields(activity.targetDurationSeconds),
    pacePerKilometre: "",
  };

  if (activity.activityType === "STRENGTH") return values;

  const runValues = {
    ...values,
    distanceKilometres:
      activity.targetDistanceMetres === null
        ? ""
        : String(activity.targetDistanceMetres / 1000),
    pacePerKilometre:
      activity.targetPaceSecondsPerKilometre === null
        ? ""
        : formatPace(activity.targetPaceSecondsPerKilometre, {
            includeUnit: false,
          }),
  };

  const derivedMetric: Record<
    typeof activity.targetType,
    RunFieldMetric
  > = {
    DISTANCE_DURATION: "pace",
    DISTANCE_PACE: "duration",
    DURATION_PACE: "distance",
  };

  return {
    ...runValues,
    ...(calculateDerivedMetric(
      runValues,
      derivedMetric[activity.targetType],
    ) ?? { derivedMetric: derivedMetric[activity.targetType] }),
  };
}
