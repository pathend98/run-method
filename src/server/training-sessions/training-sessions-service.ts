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
import type { TrainingSessionsValidator } from "./training-sessions-validator";

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
  constructor(
    private readonly repository: TrainingSessionsRepository,
    private readonly validator: TrainingSessionsValidator,
  ) {}

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

    this.validator.validateEdit(current, request);
    if (this.isUnchanged(current, request)) return current;

    return this.repository.edit(current, request);
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

    if (request.activityType === "STRENGTH") {
      return current.targetDurationSeconds === request.targetDurationSeconds;
    }
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
