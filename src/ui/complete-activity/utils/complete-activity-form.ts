import { z } from "zod";

import type {
  CompleteTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import {
  distanceToMetres,
  formatDistanceInput,
  type RunFieldUnit,
} from "@/ui/run-field-input/run-field-units";
import {
  durationFieldsSchema,
  durationFieldsToSeconds,
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

export const completeActivityFormSchema = z
  .object({
    ...durationFieldsSchema.shape,
    derivedMetric: z.enum(["distance", "duration", "pace"]).nullable(),
    distance: z.string(),
    pace: z.string(),
  })
  .superRefine((values, context) => {
    if (durationFieldsToSeconds(values) === 0) {
      context.addIssue({
        code: "custom",
        path: ["durationHours"],
        message: "Duration must be greater than zero",
      });
    }
  });

export type CompleteActivityFormValues = z.infer<
  typeof completeActivityFormSchema
>;

export function calculatePaceSecondsPerKilometre(
  distanceMetres: number,
  durationSeconds: number,
) {
  return Math.round((durationSeconds * 1000) / distanceMetres);
}

export function createCompleteActivityFormSchema(
  activity: TrainingSession,
  unit: RunFieldUnit,
) {
  return completeActivityFormSchema.superRefine((values, context) => {
    if (activity.activityType !== "RUN") return;
    const result = positiveDistanceSchema(unit).safeParse(values.distance);
    if (!result.success) {
      context.addIssue({
        code: "custom",
        path: ["distance"],
        message: result.error.issues[0].message,
      });
    }
  });
}

export function toCompleteTrainingSessionRequest(
  activity: TrainingSession,
  values: CompleteActivityFormValues,
  unit: RunFieldUnit,
): CompleteTrainingSessionRequest {
  const parsed = createCompleteActivityFormSchema(activity, unit).parse(values);
  return {
    actualDurationSeconds: durationFieldsToSeconds(parsed),
    ...(activity.activityType === "RUN"
      ? {
          actualDistanceMetres:
            parsed.distance ===
            (unit === "MILES"
              ? formatDistanceInput(activity.targetDistanceMetres, unit)
              : (activity.targetDistanceMetres / 1000).toFixed(1))
              ? activity.targetDistanceMetres
              : distanceToMetres(parsed.distance, unit),
        }
      : {}),
  };
}
