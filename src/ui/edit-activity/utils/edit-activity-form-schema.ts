import { z } from "zod";

import type { TrainingSession } from "@/domain/training-sessions";
import { getRunTargetMetrics } from "@/ui/training-sessions/run-target-metrics";

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

    const targetMetrics = getRunTargetMetrics(activity.targetType);

    if (targetMetrics.distance) {
      validateField(
        context,
        "distanceKilometres",
        positiveDistanceSchema,
        values.distanceKilometres,
      );
    }
    if (targetMetrics.duration) {
      validateField(
        context,
        "durationMinutes",
        positiveWholeMinutes,
        values.durationMinutes,
      );
    }
    if (targetMetrics.pace) {
      validateField(
        context,
        "pacePerKilometre",
        paceSchema,
        values.pacePerKilometre,
      );
    }
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
    context.addIssue({
      code: "custom",
      path: [field],
      message: result.error.issues[0].message,
    });
  }
}
