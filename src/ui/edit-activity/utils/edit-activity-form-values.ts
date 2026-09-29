import type { TrainingSession } from "@/domain/training-sessions";
import {
  formatDistanceInput,
  formatPaceInput,
  metresPerUnit,
  type RunFieldUnit,
} from "@/ui/run-field-input/run-field-units";
import {
  durationFieldsToSeconds,
  durationSecondsToFields,
} from "@/ui/training-sessions/duration-fields";
import type { EditActivityFormValues } from "./edit-activity-form-schema";

export function getEditActivityFormValues(
  activity: TrainingSession,
  unit: RunFieldUnit,
): EditActivityFormValues {
  const isCompleted = activity.status === "COMPLETED";
  const values: EditActivityFormValues = {
    title: activity.title,
    date: activity.date,
    timeOfDay: activity.timeOfDay ?? "ANY",
    description: activity.description ?? "",
    derivedMetric: null,
    distance: "",
    ...durationSecondsToFields(
      isCompleted
        ? (activity.actualDurationSeconds ?? activity.targetDurationSeconds)
        : activity.targetDurationSeconds,
    ),
    pace: "",
  };

  if (activity.activityType === "STRENGTH") return values;

  const distanceMetres = isCompleted
    ? (activity.actualDistanceMetres ?? activity.targetDistanceMetres)
    : activity.targetDistanceMetres;
  const runValues = {
    ...values,
    distance: formatDistanceInput(distanceMetres, unit),
  };

  return {
    ...runValues,
    derivedMetric: "pace",
    pace: formatPaceInput(
      Math.max(
        1,
        Math.round(
          (durationFieldsToSeconds(runValues) * metresPerUnit(unit)) /
            distanceMetres,
        ),
      ),
    ),
  };
}
