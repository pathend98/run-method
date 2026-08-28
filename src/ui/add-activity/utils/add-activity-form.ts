import { z } from "zod";

import {
  createTrainingSessionRequestSchema,
  type CreateTrainingSessionRequest,
} from "@/domain/training-sessions";

const positiveDistanceSchema = z
  .string()
  .regex(/^\d+(?:\.\d{1,3})?$/, "Enter a distance in kilometres")
  .refine((value) => Number(value) > 0, "Distance must be greater than zero");
const positiveWholeMinutes = z
  .string()
  .regex(/^\d+$/, "Enter whole minutes")
  .refine((value) => Number(value) > 0, "Duration must be greater than zero");
const pace = z
  .string()
  .regex(/^\d+:[0-5]\d$/, "Enter pace as mm:ss")
  .refine((value) => {
    const [minutes, seconds] = value.split(":").map(Number);
    return minutes * 60 + seconds > 0;
  }, "Pace must be greater than zero");

export const addActivityFormSchema = z
  .object({
    title: z.string().trim().min(1, "Enter an activity title"),
    activityType: z.enum(["RUN", "STRENGTH"]),
    targetType: z.enum(["DISTANCE_DURATION", "DISTANCE_PACE", "DURATION_PACE"]),
    timeOfDay: z.enum(["AM", "ANY", "PM"]),
    description: z.string(),
    distanceKilometres: z.string(),
    durationMinutes: z.string(),
    pacePerKilometre: z.string(),
  })
  .superRefine((value, context) => {
    if (value.activityType === "STRENGTH") {
      if (value.durationMinutes !== "") {
        validateField(
          context,
          "durationMinutes",
          positiveWholeMinutes,
          value.durationMinutes,
        );
      }
      return;
    }

    if (
      value.targetType === "DISTANCE_DURATION" ||
      value.targetType === "DISTANCE_PACE"
    ) {
      validateField(
        context,
        "distanceKilometres",
        positiveDistanceSchema,
        value.distanceKilometres,
      );
    }
    if (
      value.targetType === "DISTANCE_DURATION" ||
      value.targetType === "DURATION_PACE"
    ) {
      validateField(
        context,
        "durationMinutes",
        positiveWholeMinutes,
        value.durationMinutes,
      );
    }
    if (
      value.targetType === "DISTANCE_PACE" ||
      value.targetType === "DURATION_PACE"
    ) {
      validateField(context, "pacePerKilometre", pace, value.pacePerKilometre);
    }
  });

export type AddActivityFormValues = z.infer<typeof addActivityFormSchema>;

export const defaultAddActivityFormValues: AddActivityFormValues = {
  title: "",
  activityType: "RUN",
  targetType: "DISTANCE_DURATION",
  timeOfDay: "ANY",
  description: "",
  distanceKilometres: "",
  durationMinutes: "",
  pacePerKilometre: "",
};

export function toCreateTrainingSessionRequest(
  values: AddActivityFormValues,
  date: string,
): CreateTrainingSessionRequest {
  const parsed = addActivityFormSchema.parse(values);
  const base = {
    title: parsed.title,
    date,
    timeOfDay: parsed.timeOfDay === "ANY" ? null : parsed.timeOfDay,
    description: parsed.description.trim() || null,
  };

  if (parsed.activityType === "STRENGTH") {
    return createTrainingSessionRequestSchema.parse({
      ...base,
      activityType: "STRENGTH",
      targetDurationSeconds:
        parsed.durationMinutes === ""
          ? null
          : Number(parsed.durationMinutes) * 60,
    });
  }

  const distance = Number(parsed.distanceKilometres) * 1000;
  const duration = Number(parsed.durationMinutes) * 60;
  const [paceMinutes, paceSeconds] = parsed.pacePerKilometre
    .split(":")
    .map(Number);
  const paceSecondsPerKilometre = paceMinutes * 60 + paceSeconds;

  if (parsed.targetType === "DISTANCE_DURATION") {
    return createTrainingSessionRequestSchema.parse({
      ...base,
      activityType: "RUN",
      targetType: parsed.targetType,
      targetDistanceMetres: distance,
      targetDurationSeconds: duration,
    });
  }
  if (parsed.targetType === "DISTANCE_PACE") {
    return createTrainingSessionRequestSchema.parse({
      ...base,
      activityType: "RUN",
      targetType: parsed.targetType,
      targetDistanceMetres: distance,
      targetPaceSecondsPerKilometre: paceSecondsPerKilometre,
    });
  }
  return createTrainingSessionRequestSchema.parse({
    ...base,
    activityType: "RUN",
    targetType: parsed.targetType,
    targetDurationSeconds: duration,
    targetPaceSecondsPerKilometre: paceSecondsPerKilometre,
  });
}

function validateField(
  context: z.RefinementCtx,
  field: "distanceKilometres" | "durationMinutes" | "pacePerKilometre",
  schema: z.ZodType<string>,
  value: string,
) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const [issue] = result.error.issues;
    context.addIssue({
      code: "custom",
      path: [field],
      message: issue.message,
    });
  }
}
