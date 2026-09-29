import {
  editTrainingSessionRequestSchema,
  type EditTrainingSessionRequest,
  type TrainingSession,
} from "@/domain/training-sessions";
import { durationFieldsToSeconds } from "@/ui/training-sessions/duration-fields";
import {
  distanceToMetres,
  formatDistanceInput,
  type RunFieldUnit,
} from "@/ui/run-field-input/run-field-units";
import {
  createEditActivityFormSchema,
  type EditActivityFormValues,
} from "./edit-activity-form-schema";

export function toEditTrainingSessionRequest(
  values: EditActivityFormValues,
  activity: TrainingSession,
  unit: RunFieldUnit,
): EditTrainingSessionRequest {
  const parsed = createEditActivityFormSchema(activity, unit).parse(values);
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
      actualDistanceMetres: requestDistance(
        parsed.distance,
        activity.actualDistanceMetres ?? activity.targetDistanceMetres,
        unit,
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

  const distance = requestDistance(
    parsed.distance,
    activity.targetDistanceMetres,
    unit,
  );
  const duration = durationFieldsToSeconds(parsed);
  return editTrainingSessionRequestSchema.parse({
    ...base,
    activityType: activity.activityType,
    targetDistanceMetres: distance,
    targetDurationSeconds: duration,
  });
}

function requestDistance(
  distance: string,
  originalMetres: number,
  unit: RunFieldUnit,
) {
  return distance === formatDistanceInput(originalMetres, unit)
    ? originalMetres
    : distanceToMetres(distance, unit);
}
