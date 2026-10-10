import { z } from "zod";

import type {
  CompleteTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import {
  RunMetricInputModel,
  runFieldIssueMessage,
  type RunningMetricUnit,
} from "@/ui/training-sessions/run-metric-input";
import {
  durationFieldsSchema,
  durationFieldsToSeconds,
} from "@/ui/shared/duration-form-input";

export const completeTrainingSessionFormSchema = z
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

export type CompleteTrainingSessionFormValues = z.infer<
  typeof completeTrainingSessionFormSchema
>;

export function createCompleteTrainingSessionFormSchema(
  trainingSession: TrainingSession,
  unit: RunningMetricUnit,
) {
  return completeTrainingSessionFormSchema.superRefine((values, context) => {
    if (trainingSession.activityType !== "RUN") return;
    const distanceIssue = new RunMetricInputModel(unit)
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
  trainingSession: TrainingSession,
  values: CompleteTrainingSessionFormValues,
  unit: RunningMetricUnit,
): CompleteTrainingSessionRequest {
  const parsed = createCompleteTrainingSessionFormSchema(
    trainingSession,
    unit,
  ).parse(values);
  const metrics = new RunMetricInputModel(unit);
  return {
    actualDurationSeconds: durationFieldsToSeconds(parsed),
    ...(trainingSession.activityType === "RUN"
      ? {
          actualDistanceMetres: metrics.readDistanceInput(
            parsed.distance,
            trainingSession.targetDistanceMetres,
          ),
        }
      : {}),
  };
}
