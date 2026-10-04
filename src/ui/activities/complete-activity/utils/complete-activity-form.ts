import { z } from "zod";

import type {
  CompleteTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import {
  RunningMetrics,
  runFieldIssueMessage,
  type RunningMetricUnit,
} from "@/ui/activities/running-metrics";
import {
  durationFieldsSchema,
  durationFieldsToSeconds,
} from "@/ui/training-sessions/duration-fields";

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

export function createCompleteActivityFormSchema(
  activity: TrainingSession,
  unit: RunningMetricUnit,
) {
  return completeActivityFormSchema.superRefine((values, context) => {
    if (activity.activityType !== "RUN") return;
    const distanceIssue = new RunningMetrics(unit)
      .validate(values, false)
      .find((issue) => issue.field === "distance");
    if (distanceIssue) {
      context.addIssue({
        code: "custom",
        path: ["distance"],
        message: runFieldIssueMessage(distanceIssue, unit),
      });
    }
  });
}

export function toCompleteTrainingSessionRequest(
  activity: TrainingSession,
  values: CompleteActivityFormValues,
  unit: RunningMetricUnit,
): CompleteTrainingSessionRequest {
  const parsed = createCompleteActivityFormSchema(activity, unit).parse(values);
  const metrics = new RunningMetrics(unit);
  return {
    actualDurationSeconds: durationFieldsToSeconds(parsed),
    ...(activity.activityType === "RUN"
      ? {
          actualDistanceMetres: metrics.readDistanceInput(
            parsed.distance,
            activity.targetDistanceMetres,
          ),
        }
      : {}),
  };
}
