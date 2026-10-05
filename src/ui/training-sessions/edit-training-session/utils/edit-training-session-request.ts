import {
  editTrainingSessionRequestSchema,
  type EditTrainingSessionRequest,
  type TrainingSession,
} from "@/domain/training-sessions";
import { RunningMetrics, type RunningMetricUnit } from "@/ui/runs/run-metrics";
import { durationFieldsToSeconds } from "../../training-session-duration";
import {
  createEditTrainingSessionFormSchema,
  type EditTrainingSessionFormValues,
} from "./edit-training-session-form-schema";

export function toEditTrainingSessionRequest(
  values: EditTrainingSessionFormValues,
  trainingSession: TrainingSession,
  unit: RunningMetricUnit,
): EditTrainingSessionRequest {
  const parsed = createEditTrainingSessionFormSchema(
    trainingSession,
    unit,
  ).parse(values);
  const metrics = new RunningMetrics(unit);
  const base = {
    title: parsed.title,
    description: parsed.description.trim() || null,
    ...(trainingSession.status === "SCHEDULED" ? { date: parsed.date } : {}),
    timeOfDay:
      trainingSession.status === "SCHEDULED"
        ? parsed.timeOfDay === "ANY"
          ? null
          : parsed.timeOfDay
        : trainingSession.timeOfDay,
  };

  if (trainingSession.activityType === "STRENGTH") {
    return editTrainingSessionRequestSchema.parse({
      ...base,
      activityType: trainingSession.activityType,
      targetDurationSeconds:
        trainingSession.status !== "SCHEDULED"
          ? trainingSession.targetDurationSeconds
          : durationFieldsToSeconds(parsed) === 0
            ? null
            : durationFieldsToSeconds(parsed),
      ...(trainingSession.status === "COMPLETED"
        ? { actualDurationSeconds: durationFieldsToSeconds(parsed) }
        : {}),
    });
  }

  if (trainingSession.status === "COMPLETED") {
    return editTrainingSessionRequestSchema.parse({
      ...base,
      activityType: trainingSession.activityType,
      targetDistanceMetres: trainingSession.targetDistanceMetres,
      targetDurationSeconds: trainingSession.targetDurationSeconds,
      actualDistanceMetres: metrics.readDistanceInput(
        parsed.distance,
        trainingSession.actualDistanceMetres ??
          trainingSession.targetDistanceMetres,
      ),
      actualDurationSeconds: durationFieldsToSeconds(parsed),
    });
  }

  if (trainingSession.status === "SKIPPED") {
    return editTrainingSessionRequestSchema.parse({
      ...base,
      activityType: trainingSession.activityType,
      targetDistanceMetres: trainingSession.targetDistanceMetres,
      targetDurationSeconds: trainingSession.targetDurationSeconds,
    });
  }

  const distance = metrics.readDistanceInput(
    parsed.distance,
    trainingSession.targetDistanceMetres,
  );
  const duration = durationFieldsToSeconds(parsed);
  return editTrainingSessionRequestSchema.parse({
    ...base,
    activityType: trainingSession.activityType,
    targetDistanceMetres: distance,
    targetDurationSeconds: duration,
  });
}
