import {
  editTrainingSessionRequestSchema,
  type EditTrainingSessionRequest,
  type TrainingSession,
} from "@/domain/training-sessions";
import { RunningMetrics, type RunningMetricUnit } from "@/ui/runs/run-metrics";
import { durationFieldsToSeconds } from "@/ui/training-sessions/duration-fields";
import {
  createEditActivityFormSchema,
  type EditActivityFormValues,
} from "./edit-activity-form-schema";

export function toEditTrainingSessionRequest(
  values: EditActivityFormValues,
  activity: TrainingSession,
  unit: RunningMetricUnit,
): EditTrainingSessionRequest {
  const parsed = createEditActivityFormSchema(activity, unit).parse(values);
  const metrics = new RunningMetrics(unit);
  const base = {
    title: parsed.title,
    description: parsed.description.trim() || null,
    ...(activity.status === "SCHEDULED" ? { date: parsed.date } : {}),
    timeOfDay:
      activity.status === "SCHEDULED"
        ? parsed.timeOfDay === "ANY"
          ? null
          : parsed.timeOfDay
        : activity.timeOfDay,
  };

  if (activity.activityType === "STRENGTH") {
    return editTrainingSessionRequestSchema.parse({
      ...base,
      activityType: activity.activityType,
      targetDurationSeconds:
        activity.status !== "SCHEDULED"
          ? activity.targetDurationSeconds
          : durationFieldsToSeconds(parsed) === 0
            ? null
            : durationFieldsToSeconds(parsed),
      ...(activity.status === "COMPLETED"
        ? { actualDurationSeconds: durationFieldsToSeconds(parsed) }
        : {}),
    });
  }

  if (activity.status === "COMPLETED") {
    return editTrainingSessionRequestSchema.parse({
      ...base,
      activityType: activity.activityType,
      targetDistanceMetres: activity.targetDistanceMetres,
      targetDurationSeconds: activity.targetDurationSeconds,
      actualDistanceMetres: metrics.readDistanceInput(
        parsed.distance,
        activity.actualDistanceMetres ?? activity.targetDistanceMetres,
      ),
      actualDurationSeconds: durationFieldsToSeconds(parsed),
    });
  }

  if (activity.status === "SKIPPED") {
    return editTrainingSessionRequestSchema.parse({
      ...base,
      activityType: activity.activityType,
      targetDistanceMetres: activity.targetDistanceMetres,
      targetDurationSeconds: activity.targetDurationSeconds,
    });
  }

  const distance = metrics.readDistanceInput(
    parsed.distance,
    activity.targetDistanceMetres,
  );
  const duration = durationFieldsToSeconds(parsed);
  return editTrainingSessionRequestSchema.parse({
    ...base,
    activityType: activity.activityType,
    targetDistanceMetres: distance,
    targetDurationSeconds: duration,
  });
}
