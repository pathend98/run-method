import {
  editTrainingSessionRequestSchema,
  type EditTrainingSessionRequest,
  type TrainingSession,
} from "@/domain/training-sessions";
import { durationFieldsToSeconds } from "@/ui/training-sessions/duration-fields";
import {
  createEditActivityFormSchema,
  type EditActivityFormValues,
} from "./edit-activity-form-schema";

export function toEditTrainingSessionRequest(
  values: EditActivityFormValues,
  activity: TrainingSession,
): EditTrainingSessionRequest {
  const parsed = createEditActivityFormSchema(activity).parse(values);
  const base = {
    title: parsed.title,
    description: parsed.description.trim() || null,
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
      actualDistanceMetres: Number(parsed.distanceKilometres) * 1000,
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

  const distance = Number(parsed.distanceKilometres) * 1000;
  const duration = durationFieldsToSeconds(parsed);
  return editTrainingSessionRequestSchema.parse({
    ...base,
    activityType: activity.activityType,
    targetDistanceMetres: distance,
    targetDurationSeconds: duration,
  });
}
