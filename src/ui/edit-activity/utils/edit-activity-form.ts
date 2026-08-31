import { z } from "zod";

import {
  editTrainingSessionRequestSchema,
  type EditTrainingSessionRequest,
  type TrainingSession,
} from "@/domain/training-sessions";

const positiveDistanceSchema = z
  .string()
  .regex(/^\d+(?:\.\d{1,3})?$/, "Enter a distance in kilometres")
  .refine((value) => Number(value) > 0, "Distance must be greater than zero");
const positiveWholeMinutes = z
  .string()
  .regex(/^\d+$/, "Enter whole minutes")
  .refine((value) => Number(value) > 0, "Duration must be greater than zero");
const paceSchema = z
  .string()
  .regex(/^\d+:[0-5]\d$/, "Enter pace as mm:ss")
  .refine((value) => {
    const [minutes, seconds] = value.split(":").map(Number);
    return minutes * 60 + seconds > 0;
  }, "Pace must be greater than zero");

const editActivityFormBaseSchema = z.object({
  title: z.string().trim().min(1, "Enter an activity title"),
  timeOfDay: z.enum(["AM", "ANY", "PM"]),
  description: z.string(),
  distanceKilometres: z.string(),
  durationMinutes: z.string(),
  pacePerKilometre: z.string(),
});

export type EditActivityFormValues = z.infer<typeof editActivityFormBaseSchema>;

export function createEditActivityFormSchema(activity: TrainingSession) {
  return editActivityFormBaseSchema.superRefine((values, context) => {
    if (activity.status !== "SCHEDULED" || activity.activityType !== "RUN") {
      return;
    }

    if (
      activity.targetType === "DISTANCE_DURATION" ||
      activity.targetType === "DISTANCE_PACE"
    ) {
      validateField(
        context,
        "distanceKilometres",
        positiveDistanceSchema,
        values.distanceKilometres,
      );
    }
    if (
      activity.targetType === "DISTANCE_DURATION" ||
      activity.targetType === "DURATION_PACE"
    ) {
      validateField(
        context,
        "durationMinutes",
        positiveWholeMinutes,
        values.durationMinutes,
      );
    }
    if (
      activity.targetType === "DISTANCE_PACE" ||
      activity.targetType === "DURATION_PACE"
    ) {
      validateField(
        context,
        "pacePerKilometre",
        paceSchema,
        values.pacePerKilometre,
      );
    }
  });
}

export function getEditActivityFormValues(
  activity: TrainingSession,
): EditActivityFormValues {
  const values: EditActivityFormValues = {
    title: activity.title,
    timeOfDay: activity.timeOfDay ?? "ANY",
    description: activity.description ?? "",
    distanceKilometres: "",
    durationMinutes: "",
    pacePerKilometre: "",
  };

  if (activity.activityType === "STRENGTH") return values;

  return {
    ...values,
    distanceKilometres:
      activity.targetDistanceMetres === null
        ? ""
        : String(activity.targetDistanceMetres / 1000),
    durationMinutes:
      activity.targetDurationSeconds === null
        ? ""
        : String(activity.targetDurationSeconds / 60),
    pacePerKilometre:
      activity.targetPaceSecondsPerKilometre === null
        ? ""
        : formatPace(activity.targetPaceSecondsPerKilometre),
  };
}

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

function formatPace(secondsPerKilometre: number) {
  const minutes = Math.floor(secondsPerKilometre / 60);
  const seconds = String(secondsPerKilometre % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function validateField(
  context: z.RefinementCtx,
  field: "distanceKilometres" | "durationMinutes" | "pacePerKilometre",
  schema: z.ZodType<string>,
  value: string,
) {
  const result = schema.safeParse(value);
  if (!result.success) {
    context.addIssue({
      code: "custom",
      path: [field],
      message: result.error.issues[0].message,
    });
  }
}
