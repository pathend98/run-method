import { z } from "zod";

import type { TrainingSession } from "@/domain/training-sessions";
import type { RunFieldUnit } from "@/ui/run-field-input/run-field-units";
import {
  durationFieldsSchema,
  durationFieldsToSeconds,
  type DurationFields,
} from "@/ui/training-sessions/duration-fields";

function positiveDistanceSchema(unit: RunFieldUnit) {
  return z
    .string()
    .regex(
      /^\d+(?:\.\d{1,3})?$/,
      `Enter a distance in ${unit === "MILES" ? "miles" : "kilometres"}`,
    )
    .refine((value) => Number(value) > 0, "Distance must be greater than zero");
}
const paceSchema = z
  .string()
  .regex(/^\d+:[0-5]\d$/, "Enter pace as mm:ss")
  .refine((value) => {
    const [minutes, seconds] = value.split(":").map(Number);
    return minutes * 60 + seconds > 0;
  }, "Pace must be greater than zero");

const editActivityFormBaseSchema = z.object({
  title: z.string().trim().min(1, "Enter an activity title"),
  date: z.iso.date(),
  timeOfDay: z.enum(["AM", "ANY", "PM"]),
  description: z.string(),
  derivedMetric: z.enum(["distance", "duration", "pace"]).nullable(),
  distance: z.string(),
  durationHours: z.string(),
  durationMinutes: z.string(),
  durationSeconds: z.string(),
  pace: z.string(),
});

export type EditActivityFormValues = z.infer<typeof editActivityFormBaseSchema>;

export function createEditActivityFormSchema(
  activity: TrainingSession,
  unit: RunFieldUnit,
) {
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
      "distance",
      positiveDistanceSchema(unit),
      values.distance,
    );
    validateDuration(context, values, true);
    validateField(context, "pace", paceSchema, values.pace);
  });
}

function validateField(
  context: z.RefinementCtx,
  field: "distance" | "pace",
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
