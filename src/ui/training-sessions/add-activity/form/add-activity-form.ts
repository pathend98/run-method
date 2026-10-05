import { z } from "zod";

import {
  createTrainingSessionRequestSchema,
  type CreateTrainingSessionRequest,
} from "@/domain/training-sessions";
import {
  RunningMetrics,
  runFieldIssueMessage,
  type RunningMetricUnit,
} from "@/ui/runs/run-metrics";
import {
  defaultDurationFields,
  durationFieldsSchema,
  durationFieldsToSeconds,
  type DurationFields,
} from "../../training-session-duration";

const addActivityFormBaseSchema = z.object({
  title: z.string().trim().min(1, "Enter an activity title"),
  activityType: z.enum(["RUN", "STRENGTH"]),
  derivedMetric: z.enum(["distance", "duration", "pace"]).nullable(),
  timeOfDay: z.enum(["AM", "ANY", "PM"]),
  description: z.string(),
  distance: z.string(),
  durationHours: z.string(),
  durationMinutes: z.string(),
  durationSeconds: z.string(),
  pace: z.string(),
});

export function createAddActivityFormSchema(unit: RunningMetricUnit) {
  return addActivityFormBaseSchema.superRefine((value, context) => {
    if (value.activityType === "STRENGTH") {
      if (!isZeroDuration(value)) {
        validateDuration(context, value);
      }
      return;
    }

    for (const issue of new RunningMetrics(unit).validate(value)) {
      context.addIssue({
        code: "custom",
        path: [issue.field],
        message: runFieldIssueMessage(issue, unit),
      });
    }
  });
}

export type AddActivityFormValues = z.infer<typeof addActivityFormBaseSchema>;

export const defaultAddActivityFormValues: AddActivityFormValues = {
  title: "",
  activityType: "RUN",
  derivedMetric: null,
  timeOfDay: "ANY",
  description: "",
  distance: "",
  ...defaultDurationFields,
  pace: "",
};

export function toCreateTrainingSessionRequest(
  values: AddActivityFormValues,
  date: string,
  unit: RunningMetricUnit,
): CreateTrainingSessionRequest {
  const parsed = createAddActivityFormSchema(unit).parse(values);
  const base = {
    title: parsed.title,
    date,
    timeOfDay: parsed.timeOfDay === "ANY" ? null : parsed.timeOfDay,
    description: parsed.description.trim() || null,
  };

  if (parsed.activityType === "STRENGTH") {
    return createTrainingSessionRequestSchema.parse({
      ...base,
      activityType: "STRENGTH",
      targetDurationSeconds:
        durationFieldsToSeconds(parsed) === 0
          ? null
          : durationFieldsToSeconds(parsed),
    });
  }

  const distance = new RunningMetrics(unit).readDistanceInput(parsed.distance);
  const duration = durationFieldsToSeconds(parsed);
  return createTrainingSessionRequestSchema.parse({
    ...base,
    activityType: "RUN",
    targetDistanceMetres: distance,
    targetDurationSeconds: duration,
  });
}

function validateDuration(context: z.RefinementCtx, values: DurationFields) {
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
}

function isZeroDuration(values: DurationFields) {
  return (
    values.durationHours === "00" &&
    values.durationMinutes === "00" &&
    values.durationSeconds === "00"
  );
}
