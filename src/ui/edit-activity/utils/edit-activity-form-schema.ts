import { z } from "zod";

import type { TrainingSession } from "@/domain/training-sessions";
import {
  durationFieldsSchema,
  durationFieldsToSeconds,
  type DurationFields,
} from "@/ui/training-sessions/duration-fields";

const positiveDistanceSchema = z
  .string()
  .regex(/^\d+(?:\.\d{1,3})?$/, "Enter a distance in kilometres")
  .refine((value) => Number(value) > 0, "Distance must be greater than zero");
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
  derivedMetric: z.enum(["distance", "duration", "pace"]).nullable(),
  distanceKilometres: z.string(),
  durationHours: z.string(),
  durationMinutes: z.string(),
  durationSeconds: z.string(),
  pacePerKilometre: z.string(),
});

export type EditActivityFormValues = z.infer<typeof editActivityFormBaseSchema>;

export function createEditActivityFormSchema(activity: TrainingSession) {
  return editActivityFormBaseSchema.superRefine((values, context) => {
    if (activity.status === "SKIPPED") {
      return;
    }

    if (activity.activityType === "STRENGTH") {
      if (!isZeroDuration(values)) {
        validateDuration(context, values, activity.status === "COMPLETED");
      } else if (activity.status === "COMPLETED") {
        validateDuration(context, values, true);
      }
      return;
    }

    validateField(
      context,
      "distanceKilometres",
      positiveDistanceSchema,
      values.distanceKilometres,
    );
    validateDuration(context, values, true);
    validateField(
      context,
      "pacePerKilometre",
      paceSchema,
      values.pacePerKilometre,
    );
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
    context.addIssue({
      code: "custom",
      path: [field],
      message: result.error.issues[0].message,
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
