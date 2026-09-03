import type { TrainingSession } from "@/domain/training-sessions";
import { calculateDerivedMetric } from "@/ui/run-field-input/run-field-form-input";
import { durationSecondsToFields } from "@/ui/training-sessions/duration-fields";
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
    distanceKilometres: String(activity.targetDistanceMetres / 1000),
  };

  return {
    ...runValues,
    ...calculateDerivedMetric(runValues, "pace")!,
  };
}
