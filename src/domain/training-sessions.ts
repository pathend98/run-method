import { z } from "zod";

export const timeOfDaySchema = z.union([
  z.literal("AM"),
  z.literal("PM"),
  z.null(),
]);

export const trainingSessionSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1),
  activityType: z.string().min(1),
  date: z.iso.date(),
  timeOfDay: timeOfDaySchema,
  description: z.string().min(1).nullable(),
  sortOrder: z.number().int().nonnegative(),
});

export const trainingSessionsResponseSchema = z.array(trainingSessionSchema);

export type TimeOfDay = z.infer<typeof timeOfDaySchema>;
export type TrainingSession = z.infer<typeof trainingSessionSchema>;

export type TrainingSessionDateRange = {
  from: string;
  to: string;
};
