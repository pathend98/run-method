import { z } from "zod";

import type {
  CompleteTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import {
  durationFieldsSchema,
  durationFieldsToSeconds,
} from "@/ui/training-sessions/duration-fields";

const positiveDistanceSchema = z
  .string()
  .regex(/^\d+(?:\.\d{1,3})?$/, "Enter a distance in kilometres")
  .refine((value) => Number(value) > 0, "Distance must be greater than zero");

export const completeActivityFormSchema = z
  .object({
    ...durationFieldsSchema.shape,
    derivedMetric: z.enum(["distance", "duration", "pace"]).nullable(),
    distanceKilometres: z.string(),
    pacePerKilometre: z.string(),
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

export function createCompleteActivityFormSchema(activity: TrainingSession) {
  return completeActivityFormSchema.superRefine((values, context) => {
    if (activity.activityType !== "RUN") return;
    const result = positiveDistanceSchema.safeParse(values.distanceKilometres);
    if (!result.success) {
      context.addIssue({
        code: "custom",
        path: ["distanceKilometres"],
        message: result.error.issues[0].message,
      });
    }
  });
}

export function toCompleteTrainingSessionRequest(
  activity: TrainingSession,
  values: CompleteActivityFormValues,
): CompleteTrainingSessionRequest {
  const parsed = createCompleteActivityFormSchema(activity).parse(values);
  return {
    actualDurationSeconds: durationFieldsToSeconds(parsed),
    ...(activity.activityType === "RUN"
      ? { actualDistanceMetres: Number(parsed.distanceKilometres) * 1000 }
      : {}),
  };
}
