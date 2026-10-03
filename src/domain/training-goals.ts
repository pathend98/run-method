import { z } from "zod";
import {
  positiveIntegerSchema,
  trimmedNonEmptyStringSchema,
} from "./field-schemas";

export const trainingGoalTypeSchema = z.enum([
  "RACE",
  "DISTANCE",
  "CONSISTENCY",
  "OPEN",
]);
export const trainingGoalStatusSchema = z.enum([
  "ACTIVE",
  "COMPLETED",
  "DISCARDED",
]);

export const createTrainingGoalRequestSchema = z
  .object({
    title: trimmedNonEmptyStringSchema,
    type: trainingGoalTypeSchema,
    targetDistanceMetres: positiveIntegerSchema.optional(),
    targetDate: z.iso.date().optional(),
    targetTimeSeconds: positiveIntegerSchema.optional(),
    description: trimmedNonEmptyStringSchema.optional(),
  })
  .strict();

export const trainingGoalSchema = createTrainingGoalRequestSchema.extend({
  id: z.uuid(),
  athleteId: z.uuid(),
  status: trainingGoalStatusSchema,
  createdAt: z.iso.datetime(),
});

export type TrainingGoal = z.infer<typeof trainingGoalSchema>;
export type CreateTrainingGoalRequest = z.infer<
  typeof createTrainingGoalRequestSchema
>;

export const editTrainingGoalRequestSchema = z
  .object({
    title: trimmedNonEmptyStringSchema.optional(),
    type: trainingGoalTypeSchema.optional(),
    description: trimmedNonEmptyStringSchema.nullable().optional(),
    targetDistanceMetres: positiveIntegerSchema.nullable().optional(),
    targetTimeSeconds: positiveIntegerSchema.nullable().optional(),
    targetDate: z.iso.date().nullable().optional(),
  })
  .strict()
  .refine(
    (request) => Object.values(request).some((value) => value !== undefined),
    {
      message: "At least one editable field is required",
      path: ["body"],
    },
  );

export type EditTrainingGoalRequest = z.infer<
  typeof editTrainingGoalRequestSchema
>;
