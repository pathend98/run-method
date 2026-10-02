import { z } from "zod";
import {
  positiveIntegerSchema,
  trimmedNonEmptyStringSchema,
} from "./field-schemas";

export const timeOfDaySchema = z.union([
  z.literal("AM"),
  z.literal("PM"),
  z.null(),
]);

export const activityTypeSchema = z.union([
  z.literal("RUN"),
  z.literal("STRENGTH"),
]);

export const trainingSessionStatusSchema = z.union([
  z.literal("SCHEDULED"),
  z.literal("COMPLETED"),
  z.literal("SKIPPED"),
]);

export const trainingSessionIdSchema = z.uuid();
const runActualsSchema = z.object({
  actualDistanceMetres: positiveIntegerSchema.nullable(),
  actualDurationSeconds: positiveIntegerSchema.nullable(),
});

export const baseTrainingSessionSchema = z.object({
  id: trainingSessionIdSchema,
  athleteId: trainingSessionIdSchema,
  title: z.string().min(1),
  status: trainingSessionStatusSchema,
  date: z.iso.date(),
  timeOfDay: timeOfDaySchema,
  description: z.string().min(1).nullable(),
  sortOrder: z.number().int().nonnegative(),
  skipReason: z.string().min(1).nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const runTrainingSessionSchema = baseTrainingSessionSchema
  .extend({
    activityType: z.literal("RUN"),
    targetDistanceMetres: positiveIntegerSchema,
    targetDurationSeconds: positiveIntegerSchema,
  })
  .extend(runActualsSchema.shape);

export const strengthTrainingSessionSchema = baseTrainingSessionSchema.extend({
  activityType: z.literal("STRENGTH"),
  targetDurationSeconds: positiveIntegerSchema.nullable(),
  actualDurationSeconds: positiveIntegerSchema.nullable(),
});

const rawTrainingSessionSchema = z.union([
  runTrainingSessionSchema,
  strengthTrainingSessionSchema,
]);

export const trainingSessionSchema = rawTrainingSessionSchema.superRefine(
  (session, context) => {
    if (session.status === "SKIPPED") {
      if (session.skipReason === null) {
        context.addIssue({
          code: "custom",
          message: "skipReason is required for skipped sessions",
          path: ["skipReason"],
        });
      }
    } else if (session.skipReason !== null) {
      context.addIssue({
        code: "custom",
        message: "skipReason is only allowed for skipped sessions",
        path: ["skipReason"],
      });
    }

    const actualDurationSeconds = session.actualDurationSeconds;
    const actualDistanceMetres =
      session.activityType === "RUN" ? session.actualDistanceMetres : null;

    if (session.status === "COMPLETED") {
      if (actualDurationSeconds === null) {
        context.addIssue({
          code: "custom",
          message: "actualDurationSeconds is required for completed sessions",
          path: ["actualDurationSeconds"],
        });
      }
      if (session.activityType === "RUN" && actualDistanceMetres === null) {
        context.addIssue({
          code: "custom",
          message: "actualDistanceMetres is required for completed runs",
          path: ["actualDistanceMetres"],
        });
      }
    } else {
      if (actualDurationSeconds !== null) {
        context.addIssue({
          code: "custom",
          message:
            "actualDurationSeconds is only allowed for completed sessions",
          path: ["actualDurationSeconds"],
        });
      }
      if (actualDistanceMetres !== null) {
        context.addIssue({
          code: "custom",
          message: "actualDistanceMetres is only allowed for completed runs",
          path: ["actualDistanceMetres"],
        });
      }
    }
  },
);

export const trainingSessionsResponseSchema = z.array(trainingSessionSchema);

const sessionRequestFields = {
  title: trimmedNonEmptyStringSchema,
  description: trimmedNonEmptyStringSchema.nullable(),
};

const createBaseSchema = z
  .object({
    ...sessionRequestFields,
    date: z.iso.date(),
    timeOfDay: timeOfDaySchema.optional().default(null),
    description: sessionRequestFields.description.optional().default(null),
  })
  .strict();

const createRunSchema = createBaseSchema.extend({
  activityType: z.literal("RUN"),
  targetDistanceMetres: positiveIntegerSchema,
  targetDurationSeconds: positiveIntegerSchema,
});

export const createTrainingSessionRequestSchema = z.union([
  createRunSchema,
  createBaseSchema.extend({
    activityType: z.literal("STRENGTH"),
    targetDurationSeconds: positiveIntegerSchema
      .nullable()
      .optional()
      .default(null),
  }),
]);

const editBaseSchema = z
  .object({
    ...sessionRequestFields,
    date: z.iso.date().optional(),
    timeOfDay: timeOfDaySchema,
  })
  .strict();

const editRunSchema = editBaseSchema.extend({
  activityType: z.literal("RUN"),
  targetDistanceMetres: positiveIntegerSchema,
  targetDurationSeconds: positiveIntegerSchema,
  actualDistanceMetres: positiveIntegerSchema.optional(),
  actualDurationSeconds: positiveIntegerSchema.optional(),
});

export const editTrainingSessionRequestSchema = z.union([
  editRunSchema,
  editBaseSchema.extend({
    activityType: z.literal("STRENGTH"),
    targetDurationSeconds: positiveIntegerSchema.nullable(),
    actualDurationSeconds: positiveIntegerSchema.optional(),
  }),
]);

export const skipTrainingSessionRequestSchema = z
  .object({
    skipReason: trimmedNonEmptyStringSchema,
  })
  .strict();

export const completeTrainingSessionRequestSchema = z
  .object({
    actualDurationSeconds: positiveIntegerSchema,
    actualDistanceMetres: positiveIntegerSchema.optional(),
  })
  .strict();

export type TimeOfDay = z.infer<typeof timeOfDaySchema>;
export type TrainingSessionStatus = z.infer<typeof trainingSessionStatusSchema>;
export type TrainingSession = z.infer<typeof trainingSessionSchema>;
export type RunTrainingSession = z.infer<typeof runTrainingSessionSchema>;
export type StrengthTrainingSession = z.infer<
  typeof strengthTrainingSessionSchema
>;

export type TrainingSessionDateRange = {
  from: string;
  to: string;
};

export const trainingSessionsQuerySchema = z
  .object({
    athleteId: z.uuid(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    status: trainingSessionStatusSchema.optional(),
  })
  .refine(
    ({ from, to }) => from === undefined || to === undefined || from <= to,
    { message: "from must be before or equal to to", path: ["from"] },
  );

export type TrainingSessionsQuery = {
  from?: string;
  to?: string;
  status?: TrainingSessionStatus;
};

export type CreateTrainingSessionRequest = z.infer<
  typeof createTrainingSessionRequestSchema
>;

export type EditTrainingSessionRequest = z.infer<
  typeof editTrainingSessionRequestSchema
>;

export type SkipTrainingSessionRequest = z.infer<
  typeof skipTrainingSessionRequestSchema
>;

export type CompleteTrainingSessionRequest = z.infer<
  typeof completeTrainingSessionRequestSchema
>;
