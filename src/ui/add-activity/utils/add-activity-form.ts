import { z } from "zod";

import {
  createTrainingSessionRequestSchema,
  type CreateTrainingSessionRequest,
} from "@/domain/training-sessions";
import {
  defaultDurationFields,
  durationFieldsSchema,
  durationFieldsToSeconds,
  type DurationFields,
} from "@/ui/training-sessions/duration-fields";

const positiveDistanceSchema = z
  .string()
  .regex(/^\d+(?:\.\d{1,3})?$/, "Enter a distance in kilometres")
  .refine((value) => Number(value) > 0, "Distance must be greater than zero");
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
    derivedMetric: z.enum(["distance", "duration", "pace"]).nullable(),
    timeOfDay: z.enum(["AM", "ANY", "PM"]),
    description: z.string(),
    distanceKilometres: z.string(),
    durationHours: z.string(),
    durationMinutes: z.string(),
    durationSeconds: z.string(),
    pacePerKilometre: z.string(),
  })
  .superRefine((value, context) => {
    if (value.activityType === "STRENGTH") {
      if (!isZeroDuration(value)) {
        validateDuration(context, value, false);
      }
      return;
    }

    validateField(
      context,
      "distanceKilometres",
      positiveDistanceSchema,
      value.distanceKilometres,
    );
    validateDuration(context, value, true);
    validateField(context, "pacePerKilometre", pace, value.pacePerKilometre);
  });

export type AddActivityFormValues = z.infer<typeof addActivityFormSchema>;

export const defaultAddActivityFormValues: AddActivityFormValues = {
  title: "",
  activityType: "RUN",
  derivedMetric: null,
  timeOfDay: "ANY",
  description: "",
  distanceKilometres: "",
  ...defaultDurationFields,
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
        durationFieldsToSeconds(parsed) === 0
          ? null
          : durationFieldsToSeconds(parsed),
    });
  }

  const distance = Number(parsed.distanceKilometres) * 1000;
  const duration = durationFieldsToSeconds(parsed);
  return createTrainingSessionRequestSchema.parse({
    ...base,
    activityType: "RUN",
    targetDistanceMetres: distance,
    targetDurationSeconds: duration,
  });
}

function validateField(
  context: z.RefinementCtx,
  field: "distanceKilometres" | "pacePerKilometre",
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

function validateDuration(
  context: z.RefinementCtx,
  values: DurationFields,
  required: boolean,
) {
  const result = durationFieldsSchema.safeParse(values);
  if (!result.success) {
    for (const issue of result.error.issues) {
      context.addIssue({
        code: "custom",
        path: issue.path,
        message: issue.message,
      });
    }
  }
  if (required && durationFieldsToSeconds(values) === 0) {
    context.addIssue({
      code: "custom",
      path: ["durationHours"],
      message: "Duration must be greater than zero",
    });
  }
}

function isZeroDuration(values: DurationFields) {
  return (
    values.durationHours === "00" &&
    values.durationMinutes === "00" &&
    values.durationSeconds === "00"
  );
}
