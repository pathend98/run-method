import { z } from "zod";
import { trimmedNonEmptyStringSchema } from "./field-schemas";

const editableFieldsSchema = z
  .object({
    title: trimmedNonEmptyStringSchema,
    purpose: trimmedNonEmptyStringSchema,
    trainingIntentions: trimmedNonEmptyStringSchema,
    startDate: z.iso.date(),
    targetDate: z.iso.date(),
  })
  .strict();

export const createTrainingGoalRequestSchema = editableFieldsSchema.refine(
  (goal) => goal.startDate <= goal.targetDate,
  {
    message: "Target date must be on or after start date",
    path: ["targetDate"],
  },
);

export const trainingGoalResolutionSchema = z.enum(["completed", "discarded"]);

export const trainingGoalSchema = editableFieldsSchema
  .extend({
    id: z.uuid(),
    athleteId: z.uuid(),
    createdAt: z.iso.datetime(),
    resolution: trainingGoalResolutionSchema.nullable(),
    resolvedAt: z.iso.datetime().nullable(),
  })
  .refine((goal) => goal.startDate <= goal.targetDate, {
    message: "Target date must be on or after start date",
    path: ["targetDate"],
  })
  .refine((goal) => (goal.resolution === null) === (goal.resolvedAt === null), {
    message: "Resolution and resolvedAt must both be null or both be populated",
    path: ["resolvedAt"],
  });

export const editTrainingGoalRequestSchema = editableFieldsSchema
  .partial()
  .refine(
    (request) => Object.values(request).some((value) => value !== undefined),
    {
      message: "At least one editable field is required",
      path: ["body"],
    },
  );

export type TrainingGoal = z.infer<typeof trainingGoalSchema>;
export type CreateTrainingGoalRequest = z.infer<
  typeof createTrainingGoalRequestSchema
>;
export type EditTrainingGoalRequest = z.infer<
  typeof editTrainingGoalRequestSchema
>;

export function isTrainingGoalActive(
  goal: TrainingGoal,
  today: string,
): boolean {
  return (
    goal.resolution === null &&
    goal.startDate <= today &&
    goal.targetDate >= today
  );
}
