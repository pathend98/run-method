import { runDetails, strengthDetails, trainingSessions } from "@db/schema";
import {
  timeOfDaySchema,
  trainingSessionSchema,
  trainingSessionStatusSchema,
  type TrainingSession,
} from "@/domain/training-sessions";
import { TrainingSessionsDataIntegrityError } from "./training-sessions-errors";

export type TrainingSessionRow = {
  session: typeof trainingSessions.$inferSelect;
  runDetails: typeof runDetails.$inferSelect | null;
  strengthDetails: typeof strengthDetails.$inferSelect | null;
};

export interface TrainingSessionsTransformer {
  transform(row: TrainingSessionRow): TrainingSession;
}

export class DefaultTrainingSessionsTransformer
  implements TrainingSessionsTransformer
{
  transform(row: TrainingSessionRow): TrainingSession {
    const timeOfDayResult = timeOfDaySchema.safeParse(row.session.timeOfDay);
    const statusResult = trainingSessionStatusSchema.safeParse(
      row.session.status,
    );

    if (!timeOfDayResult.success) {
      throw new TrainingSessionsDataIntegrityError(
        `Training session ${row.session.id} has invalid time of day`,
      );
    }

    if (!statusResult.success) {
      throw new TrainingSessionsDataIntegrityError(
        `Training session ${row.session.id} has invalid status`,
      );
    }

    const base = {
      id: row.session.id,
      title: row.session.title,
      status: statusResult.data,
      date: row.session.date,
      timeOfDay: timeOfDayResult.data,
      description: row.session.description,
      sortOrder: row.session.sortOrder,
      skipReason: row.session.skipReason,
      createdAt: row.session.createdAt.toISOString(),
      updatedAt: row.session.updatedAt.toISOString(),
    };

    if (row.session.activityType === "RUN") {
      if (!row.runDetails) {
        throw new TrainingSessionsDataIntegrityError(
          `Run session ${row.session.id} is missing run details`,
        );
      }

      return this.parseTrainingSession({
        ...base,
        activityType: "RUN",
        targetType: row.runDetails.targetType,
        targetDistanceMetres: row.runDetails.targetDistanceMetres,
        targetDurationSeconds: row.runDetails.targetDurationSeconds,
        targetPaceSecondsPerKilometre:
          row.runDetails.targetPaceSecondsPerKilometre,
        actualDistanceMetres: row.runDetails.actualDistanceMetres,
        actualDurationSeconds: row.runDetails.actualDurationSeconds,
      });
    }

    if (row.session.activityType === "STRENGTH") {
      if (!row.strengthDetails) {
        throw new TrainingSessionsDataIntegrityError(
          `Strength session ${row.session.id} is missing strength details`,
        );
      }

      return this.parseTrainingSession({
        ...base,
        activityType: "STRENGTH",
        targetDurationSeconds: row.strengthDetails.targetDurationSeconds,
        actualDurationSeconds: row.strengthDetails.actualDurationSeconds,
      });
    }

    throw new TrainingSessionsDataIntegrityError(
      `Unsupported activity type ${row.session.activityType}`,
    );
  }

  private parseTrainingSession(session: unknown): TrainingSession {
    const result = trainingSessionSchema.safeParse(session);

    if (!result.success) {
      throw new TrainingSessionsDataIntegrityError(
        "Training session row does not match the domain read model",
      );
    }

    return result.data;
  }
}
