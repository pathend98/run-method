import {
  editTrainingSessionRequestSchema,
  type EditTrainingSessionRequest,
  type TrainingSession,
} from "@/domain/training-sessions";
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
    });
  }

  if (activity.status !== "SCHEDULED") {
    return editTrainingSessionRequestSchema.parse({
      ...base,
      activityType: activity.activityType,
      targetType: activity.targetType,
      ...currentRunTargets(activity),
    });
  }

  const distance = Number(parsed.distanceKilometres) * 1000;
  const duration = Number(parsed.durationMinutes) * 60;
  const [paceMinutes, paceSeconds] = parsed.pacePerKilometre
    .split(":")
    .map(Number);
  const pace = paceMinutes * 60 + paceSeconds;

  if (activity.targetType === "DISTANCE_DURATION") {
    return editTrainingSessionRequestSchema.parse({
      ...base,
      activityType: activity.activityType,
      targetType: activity.targetType,
      targetDistanceMetres: distance,
      targetDurationSeconds: duration,
    });
  }
  if (activity.targetType === "DISTANCE_PACE") {
    return editTrainingSessionRequestSchema.parse({
      ...base,
      activityType: activity.activityType,
      targetType: activity.targetType,
      targetDistanceMetres: distance,
      targetPaceSecondsPerKilometre: pace,
    });
  }
  return editTrainingSessionRequestSchema.parse({
    ...base,
    activityType: activity.activityType,
    targetType: activity.targetType,
    targetDurationSeconds: duration,
    targetPaceSecondsPerKilometre: pace,
  });
}

function currentRunTargets(
  activity: Extract<TrainingSession, { activityType: "RUN" }>,
) {
  if (activity.targetType === "DISTANCE_DURATION") {
    return {
      targetDistanceMetres: activity.targetDistanceMetres,
      targetDurationSeconds: activity.targetDurationSeconds,
    };
  }
  if (activity.targetType === "DISTANCE_PACE") {
    return {
      targetDistanceMetres: activity.targetDistanceMetres,
      targetPaceSecondsPerKilometre: activity.targetPaceSecondsPerKilometre,
    };
  }
  return {
    targetDurationSeconds: activity.targetDurationSeconds,
    targetPaceSecondsPerKilometre: activity.targetPaceSecondsPerKilometre,
  };
}
