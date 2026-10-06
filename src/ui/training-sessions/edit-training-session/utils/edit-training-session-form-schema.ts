import { z } from "zod";

import type { TrainingSession } from "@/domain/training-sessions";
import { RunningMetrics, type RunningMetricUnit } from "@/ui/runs/run-metrics";
import {
  durationFieldsSchema,
  durationFieldsToSeconds,
  type DurationFields,
} from "@/ui/shared/duration-form-input";
import { runFieldIssueMessage } from "@/ui/runs/run-metrics";

const editTrainingSessionFormBaseSchema = z.object({
  title: z.string().trim().min(1, "Enter a training session title"),
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

export type EditTrainingSessionFormValues = z.infer<
  typeof editTrainingSessionFormBaseSchema
>;

export function createEditTrainingSessionFormSchema(
  trainingSession: TrainingSession,
  unit: RunningMetricUnit,
) {
  return editTrainingSessionFormBaseSchema.superRefine((values, context) => {
    if (trainingSession.status === "SKIPPED") {
      return;
    }

    if (trainingSession.activityType === "STRENGTH") {
      if (!isZeroDuration(values)) {
        validateDuration(
          context,
          values,
          trainingSession.status === "COMPLETED",
        );
      } else if (trainingSession.status === "COMPLETED") {
        validateDuration(context, values, true);
      }
      return;
    }

    for (const issue of new RunningMetrics(unit).validate(values)) {
      context.addIssue({
        code: "custom",
        path: [issue.field],
        message: runFieldIssueMessage(issue, unit),
      });
    }
  });
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
