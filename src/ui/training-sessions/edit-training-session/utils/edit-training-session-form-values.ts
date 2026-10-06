import type { TrainingSession } from "@/domain/training-sessions";
import { RunningMetrics, type RunningMetricUnit } from "@/ui/runs/run-metrics";
import { durationSecondsToFields } from "@/ui/shared/duration-form-input";
import type { EditTrainingSessionFormValues } from "./edit-training-session-form-schema";

export function getEditTrainingSessionFormValues(
  trainingSession: TrainingSession,
  unit: RunningMetricUnit,
): EditTrainingSessionFormValues {
  const isCompleted = trainingSession.status === "COMPLETED";
  const values: EditTrainingSessionFormValues = {
    title: trainingSession.title,
    date: trainingSession.date,
    timeOfDay: trainingSession.timeOfDay ?? "ANY",
    description: trainingSession.description ?? "",
    derivedMetric: null,
    distance: "",
    ...durationSecondsToFields(
      isCompleted
        ? (trainingSession.actualDurationSeconds ??
            trainingSession.targetDurationSeconds)
        : trainingSession.targetDurationSeconds,
    ),
    pace: "",
  };

  if (trainingSession.activityType === "STRENGTH") return values;

  const distanceMetres = isCompleted
    ? (trainingSession.actualDistanceMetres ??
      trainingSession.targetDistanceMetres)
    : trainingSession.targetDistanceMetres;
  return {
    ...values,
    derivedMetric: "pace",
    ...new RunningMetrics(unit).prefill(
      distanceMetres,
      isCompleted
        ? (trainingSession.actualDurationSeconds ??
            trainingSession.targetDurationSeconds)
        : trainingSession.targetDurationSeconds,
    ),
  };
}
