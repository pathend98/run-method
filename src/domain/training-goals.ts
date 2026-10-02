import { z } from "zod";

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
    title: z.string().trim().min(1),
    type: trainingGoalTypeSchema,
    targetDistanceMetres: z.number().int().positive().optional(),
    targetDate: z.iso.date().optional(),
    targetTimeSeconds: z.number().int().positive().optional(),
    description: z.string().trim().min(1).optional(),
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
