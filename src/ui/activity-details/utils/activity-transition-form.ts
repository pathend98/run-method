import { z } from "zod";

import type {
  CompleteTrainingSessionRequest,
  SkipTrainingSessionRequest,
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

export const skipActivityFormSchema = z.object({
  skipReason: z.string().trim().min(1, "Enter a skip reason"),
});

export const completeActivityFormSchema = z.object({
  ...durationFieldsSchema.shape,
  derivedMetric: z.enum(["distance", "duration", "pace"]).nullable(),
  distanceKilometres: z.string(),
  pacePerKilometre: z.string(),
}).superRefine((values, context) => {
  if (durationFieldsToSeconds(values) === 0) {
    context.addIssue({
      code: "custom",
      path: ["durationHours"],
      message: "Duration must be greater than zero",
    });
  }
});

export type SkipActivityFormValues = z.infer<typeof skipActivityFormSchema>;
export type CompleteActivityFormValues = z.infer<
  typeof completeActivityFormSchema
>;
export type ActivityTransitionFormValues = SkipActivityFormValues &
  CompleteActivityFormValues;

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

export function createActivityTransitionFormSchema(
  activity: TrainingSession,
  mode: "complete" | "skip",
) {
  const transitionSchema =
    mode === "skip"
      ? skipActivityFormSchema
      : createCompleteActivityFormSchema(activity);

  return z
    .object({
      skipReason: z.string(),
      ...durationFieldsSchema.shape,
      derivedMetric: z.enum(["distance", "duration", "pace"]).nullable(),
      distanceKilometres: z.string(),
      pacePerKilometre: z.string(),
    })
    .superRefine((values, context) => {
      const result = transitionSchema.safeParse(values);
      if (result.success) return;

      const issuesByPath = new Map(
        result.error.issues.map((issue) => [issue.path.join("."), issue]),
      );
      for (const issue of issuesByPath.values()) {
        context.addIssue({
          code: "custom",
          message: issue.message,
          path: issue.path,
        });
      }
    });
}

export function toSkipTrainingSessionRequest(
  values: SkipActivityFormValues,
): SkipTrainingSessionRequest {
  return skipActivityFormSchema.parse(values);
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
