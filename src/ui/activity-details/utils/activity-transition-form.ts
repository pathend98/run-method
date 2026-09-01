import { z } from "zod";

import type {
  CompleteTrainingSessionRequest,
  SkipTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";

const positiveDistanceSchema = z
  .string()
  .regex(/^\d+(?:\.\d{1,3})?$/, "Enter a distance in kilometres")
  .refine((value) => Number(value) > 0, "Distance must be greater than zero");
const positiveWholeMinutesSchema = z
  .string()
  .regex(/^\d+$/, "Enter whole minutes")
  .refine((value) => Number(value) > 0, "Duration must be greater than zero");

export const skipActivityFormSchema = z.object({
  skipReason: z.string().trim().min(1, "Enter a skip reason"),
});

export const completeActivityFormSchema = z.object({
  durationMinutes: positiveWholeMinutesSchema,
  distanceKilometres: z.string(),
});

export type SkipActivityFormValues = z.infer<typeof skipActivityFormSchema>;
export type CompleteActivityFormValues = z.infer<
  typeof completeActivityFormSchema
>;

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
    actualDurationSeconds: Number(parsed.durationMinutes) * 60,
    ...(activity.activityType === "RUN"
      ? { actualDistanceMetres: Number(parsed.distanceKilometres) * 1000 }
      : {}),
  };
}
