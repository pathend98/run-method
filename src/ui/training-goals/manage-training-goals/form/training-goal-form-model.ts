import { z } from "zod";
import {
  createTrainingGoalRequestSchema,
  trainingGoalTypeSchema,
} from "@/domain/training-goals";
import { RunningMetrics, type RunningMetricUnit } from "@/ui/runs/run-metrics";
import {
  defaultDurationFields,
  durationFieldsSchema,
  durationFieldsToSeconds,
} from "@/ui/shared/duration-form-input";

export function createTrainingGoalFormSchema(unit: RunningMetricUnit) {
  return durationFieldsSchema
    .extend({
      title: z.string().trim().min(1, "Enter a goal title"),
      type: trainingGoalTypeSchema,
      description: z.string().trim(),
      targetDate: z.union([z.literal(""), z.iso.date()]),
      distance: z
        .string()
        .trim()
        .refine(
          (value) =>
            value === "" ||
            (/^\d+(?:\.\d{1,3})?$/.test(value) &&
              new RunningMetrics(unit).readDistanceInput(value) > 0 &&
              Number.isSafeInteger(
                new RunningMetrics(unit).readDistanceInput(value),
              )),
          "Enter a positive distance with up to three decimal places",
        ),
    })
    .refine((value) => Number.isSafeInteger(durationFieldsToSeconds(value)), {
      path: ["durationHours"],
      message: "Enter a valid target time",
    });
}

export type TrainingGoalFormValues = z.infer<
  ReturnType<typeof createTrainingGoalFormSchema>
>;

export const defaultTrainingGoalFormValues: TrainingGoalFormValues = {
  title: "",
  type: "RACE",
  description: "",
  targetDate: "",
  distance: "",
  ...defaultDurationFields,
};

export function toCreateTrainingGoalRequest(
  values: TrainingGoalFormValues,
  unit: RunningMetricUnit,
) {
  const parsed = createTrainingGoalFormSchema(unit).parse(values);
  return createTrainingGoalRequestSchema.parse({
    title: parsed.title,
    type: parsed.type,
    description: parsed.description || undefined,
    targetDate: parsed.targetDate || undefined,
    targetDistanceMetres: parsed.distance
      ? new RunningMetrics(unit).readDistanceInput(parsed.distance)
      : undefined,
    targetTimeSeconds: durationFieldsToSeconds(parsed) || undefined,
  });
}
