import { differenceInCalendarDays } from "date-fns";

import { parseDateFromString } from "@/core/date/date-parsing";
import type {
  CreateTrainingSessionRequest,
  EditTrainingSessionRequest,
  RunTrainingSession,
  TrainingSession,
} from "@/domain/training-sessions";
import { trainingSessionIdSchema } from "@/domain/training-sessions";
import {
  TrainingSessionNotFoundError,
  TrainingSessionsValidationError,
} from "./training-sessions-errors";
import type { TrainingSessionsRepository } from "./training-sessions-repository";

export interface TrainingSessionsService {
  findBetweenDates(
    from: string | null,
    to: string | null,
  ): Promise<TrainingSession[]>;
  create(request: CreateTrainingSessionRequest): Promise<TrainingSession>;
  edit(
    id: string,
    request: EditTrainingSessionRequest,
  ): Promise<TrainingSession>;
}

export class DefaultTrainingSessionsService implements TrainingSessionsService {
  constructor(private readonly repository: TrainingSessionsRepository) {}

  async findBetweenDates(
    from: string | null,
    to: string | null,
  ): Promise<TrainingSession[]> {
    if (!from || !to) {
      throw new TrainingSessionsValidationError(
        "from and to query parameters are required",
      );
    }

    const fromDate = parseDateFromString(from);
    const toDate = parseDateFromString(to);

    if (!fromDate || !toDate) {
      throw new TrainingSessionsValidationError(
        "from and to must be valid dates in YYYY-MM-DD format",
      );
    }

    if (fromDate > toDate) {
      throw new TrainingSessionsValidationError(
        "from must be before or equal to to",
      );
    }

    if (differenceInCalendarDays(toDate, fromDate) > 31) {
      throw new TrainingSessionsValidationError(
        "date range must not exceed 31 days",
      );
    }

    return this.repository.findBetweenDates(from, to);
  }

  create(request: CreateTrainingSessionRequest): Promise<TrainingSession> {
    return this.repository.create(request);
  }

  async edit(
    id: string,
    request: EditTrainingSessionRequest,
  ): Promise<TrainingSession> {
    if (!trainingSessionIdSchema.safeParse(id).success) {
      throw new TrainingSessionsValidationError(
        "training session id must be a valid UUID",
      );
    }

    const current = await this.repository.findById(id);
    if (!current) throw new TrainingSessionNotFoundError();

    this.validateEdit(current, request);
    if (this.isUnchanged(current, request)) return current;

    return this.repository.edit(current, request);
  }

  private validateEdit(
    current: TrainingSession,
    request: EditTrainingSessionRequest,
  ) {
    if (current.activityType !== request.activityType) {
      throw new TrainingSessionsValidationError(
        "activityType cannot be changed",
      );
    }

    if (current.activityType === "RUN" && request.activityType === "RUN") {
      if (current.targetType !== request.targetType) {
        throw new TrainingSessionsValidationError(
          "targetType cannot be changed",
        );
      }
    }

    if (current.status === "SCHEDULED") return;

    if (current.timeOfDay !== request.timeOfDay) {
      throw new TrainingSessionsValidationError(
        "timeOfDay cannot be changed for completed or skipped sessions",
      );
    }

    if (
      current.activityType === "RUN" &&
      request.activityType === "RUN" &&
      !this.runTargetsEqual(current, request)
    ) {
      throw new TrainingSessionsValidationError(
        "run targets cannot be changed for completed or skipped sessions",
      );
    }
  }

  private isUnchanged(
    current: TrainingSession,
    request: EditTrainingSessionRequest,
  ) {
    if (
      current.title !== request.title ||
      current.description !== request.description ||
      current.timeOfDay !== request.timeOfDay
    ) {
      return false;
    }

    if (request.activityType === "STRENGTH") return true;
    return this.runTargetsEqual(current as RunTrainingSession, request);
  }

  private runTargetsEqual(
    current: RunTrainingSession,
    request: Extract<EditTrainingSessionRequest, { activityType: "RUN" }>,
  ) {
    const requestDistance =
      "targetDistanceMetres" in request ? request.targetDistanceMetres : null;
    const requestDuration =
      "targetDurationSeconds" in request ? request.targetDurationSeconds : null;
    const requestPace =
      "targetPaceSecondsPerKilometre" in request
        ? request.targetPaceSecondsPerKilometre
        : null;

    return (
      current.targetDistanceMetres === requestDistance &&
      current.targetDurationSeconds === requestDuration &&
      current.targetPaceSecondsPerKilometre === requestPace
    );
  }
}
