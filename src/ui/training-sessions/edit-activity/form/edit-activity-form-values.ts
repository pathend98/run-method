import type { TrainingSession } from "@/domain/training-sessions";
import { RunningMetrics, type RunningMetricUnit } from "@/ui/runs/run-metrics";
import { durationSecondsToFields } from "../../training-session-duration";
import type { EditActivityFormValues } from "./edit-activity-form-schema";

export function getEditActivityFormValues(
  activity: TrainingSession,
  unit: RunningMetricUnit,
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
  return {
    ...values,
    derivedMetric: "pace",
    ...new RunningMetrics(unit).prefill(
      distanceMetres,
      isCompleted
        ? (activity.actualDurationSeconds ?? activity.targetDurationSeconds)
        : activity.targetDurationSeconds,
    ),
  };
}
