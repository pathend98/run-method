import { z } from "zod";

import {
  createTrainingSessionRequestSchema,
  type CreateTrainingSessionRequest,
} from "@/domain/training-sessions";
import {
  RunMetricInputModel,
  runFieldIssueMessage,
  type RunningMetricUnit,
} from "@/ui/training-sessions/run-metric-input";
import {
  defaultDurationFields,
  durationFieldsSchema,
  durationFieldsToSeconds,
  type DurationFields,
} from "@/ui/shared/duration-form-input";

const addTrainingSessionFormBaseSchema = z.object({
  title: z.string().trim().min(1, "Enter a training session title"),
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

export function createAddTrainingSessionFormSchema(unit: RunningMetricUnit) {
  return addTrainingSessionFormBaseSchema.superRefine((value, context) => {
    if (value.activityType === "STRENGTH") {
      if (!isZeroDuration(value)) {
        validateDuration(context, value);
      }
      return;
    }

    for (const issue of new RunMetricInputModel(unit).validate(value)) {
      context.addIssue({
        code: "custom",
        path: [issue.field],
        message: runFieldIssueMessage(issue, unit),
      });
    }
  });
}

export type AddTrainingSessionFormValues = z.infer<
  typeof addTrainingSessionFormBaseSchema
>;

export const defaultAddTrainingSessionFormValues: AddTrainingSessionFormValues =
  {
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
  values: AddTrainingSessionFormValues,
  date: string,
  unit: RunningMetricUnit,
): CreateTrainingSessionRequest {
  const parsed = createAddTrainingSessionFormSchema(unit).parse(values);
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

  const distance = new RunMetricInputModel(unit).readDistanceInput(
    parsed.distance,
  );
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
