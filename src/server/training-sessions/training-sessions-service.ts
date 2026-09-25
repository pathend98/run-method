import { parseDateFromString } from "@/core/date/date-parsing";
import type {
  CompleteTrainingSessionRequest,
  CreateTrainingSessionRequest,
  EditTrainingSessionRequest,
  RunTrainingSession,
  SkipTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import {
  trainingSessionIdSchema,
  trainingSessionStatusSchema,
} from "@/domain/training-sessions";
import {
  TrainingSessionNotFoundError,
  TrainingSessionsValidationError,
} from "./training-sessions-errors";
import type {
  TrainingSessionsFindQuery,
  TrainingSessionsRepository,
} from "./training-sessions-repository";
import type { TrainingSessionsValidator } from "./training-sessions-validator";
import type { UserService } from "../user/user-service";

export interface TrainingSessionsService {
  find(query: TrainingSessionsQueryInput): Promise<TrainingSession[]>;
  findById(id: string): Promise<TrainingSession>;
  create(request: CreateTrainingSessionInput): Promise<TrainingSession>;
  delete(id: string): Promise<void>;
  skip(
    id: string,
    request: SkipTrainingSessionRequest,
    timeZone: string | null,
  ): Promise<TrainingSession>;
  complete(
    id: string,
    request: CompleteTrainingSessionRequest,
    timeZone: string | null,
  ): Promise<TrainingSession>;
  edit(
    id: string,
    request: EditTrainingSessionRequest,
  ): Promise<TrainingSession>;
}

export type CreateTrainingSessionInput = CreateTrainingSessionRequest & {
  athleteId: string;
};

export type TrainingSessionsQueryInput = {
  athleteId?: string;
  from?: string;
  to?: string;
  status?: string;
};

export class DefaultTrainingSessionsService implements TrainingSessionsService {
  constructor(
    private readonly repository: TrainingSessionsRepository,
    private readonly validator: TrainingSessionsValidator,
    private readonly userService: UserService,
  ) {}

  async find(query: TrainingSessionsQueryInput): Promise<TrainingSession[]> {
    const { athleteId, from, to, status } = query;
    if (
      athleteId !== undefined &&
      !trainingSessionIdSchema.safeParse(athleteId).success
    ) {
      throw new TrainingSessionsValidationError(
        "athlete id must be a valid UUID",
      );
    }
    const fromDate = from === undefined ? null : parseDateFromString(from);
    const toDate = to === undefined ? null : parseDateFromString(to);

    if ((from !== undefined && !fromDate) || (to !== undefined && !toDate)) {
      throw new TrainingSessionsValidationError(
        "from and to must be valid dates in YYYY-MM-DD format when provided",
      );
    }

    if (fromDate && toDate && fromDate > toDate) {
      throw new TrainingSessionsValidationError(
        "from must be before or equal to to",
      );
    }

    const statusResult =
      status === undefined
        ? null
        : trainingSessionStatusSchema.safeParse(status);
    if (status !== undefined && !statusResult?.success) {
      throw new TrainingSessionsValidationError(
        "status must be SCHEDULED, COMPLETED, or SKIPPED",
      );
    }

    const validQuery: TrainingSessionsFindQuery = {
      ...(athleteId !== undefined ? { athleteId } : {}),
      ...(from !== undefined ? { from } : {}),
      ...(to !== undefined ? { to } : {}),
      ...(statusResult?.success ? { status: statusResult.data } : {}),
    };
    return this.repository.find(validQuery);
  }

  async create(request: CreateTrainingSessionInput): Promise<TrainingSession> {
    if (!trainingSessionIdSchema.safeParse(request.athleteId).success) {
      throw new TrainingSessionsValidationError(
        "athlete id must be a valid UUID",
      );
    }
    await this.userService.findById(request.athleteId);
    return this.repository.create(request);
  }

  async findById(id: string): Promise<TrainingSession> {
    if (!trainingSessionIdSchema.safeParse(id).success) {
      throw new TrainingSessionsValidationError(
        "training session id must be a valid UUID",
      );
    }

    const session = await this.repository.findById(id);
    if (!session) throw new TrainingSessionNotFoundError();
    return session;
  }

  async delete(id: string): Promise<void> {
    if (!trainingSessionIdSchema.safeParse(id).success) {
      throw new TrainingSessionsValidationError(
        "training session id must be a valid UUID",
      );
    }

    const deleted = await this.repository.deleteById(id);
    if (!deleted) throw new TrainingSessionNotFoundError();
  }

  async skip(
    id: string,
    request: SkipTrainingSessionRequest,
    timeZone: string | null,
  ): Promise<TrainingSession> {
    const current = await this.findForTransition(id);
    this.validator.validateSkip(current, timeZone);

    const skipped = await this.repository.skip(current, request);
    if (!skipped) {
      throw new TrainingSessionsValidationError(
        "training session is no longer scheduled",
      );
    }
    return skipped;
  }

  async complete(
    id: string,
    request: CompleteTrainingSessionRequest,
    timeZone: string | null,
  ): Promise<TrainingSession> {
    const current = await this.findForTransition(id);
    this.validator.validateComplete(current, request, timeZone);

    const completed = await this.repository.complete(current, request);
    if (!completed) {
      throw new TrainingSessionsValidationError(
        "training session is no longer scheduled",
      );
    }
    return completed;
  }

  async edit(
    id: string,
    request: EditTrainingSessionRequest,
  ): Promise<TrainingSession> {
    const current = await this.findById(id);

    this.validator.validateEdit(current, request);
    if (this.isUnchanged(current, request)) return current;

    if (request.date === undefined || request.date === current.date) {
      return this.repository.edit(current, request) as Promise<TrainingSession>;
    }

    const edited = await this.repository.edit(current, request);
    if (!edited) {
      throw new TrainingSessionsValidationError(
        "training session is no longer scheduled",
      );
    }
    return edited;
  }

  private isUnchanged(
    current: TrainingSession,
    request: EditTrainingSessionRequest,
  ) {
    if (
      current.title !== request.title ||
      current.description !== request.description ||
      (request.date !== undefined && current.date !== request.date) ||
      current.timeOfDay !== request.timeOfDay
    ) {
      return false;
    }

    if (request.activityType === "STRENGTH") {
      return (
        current.targetDurationSeconds === request.targetDurationSeconds &&
        (request.actualDurationSeconds === undefined ||
          current.actualDurationSeconds === request.actualDurationSeconds)
      );
    }
    const runCurrent = current as RunTrainingSession;
    return (
      this.runTargetsEqual(runCurrent, request) &&
      (request.actualDistanceMetres === undefined ||
        runCurrent.actualDistanceMetres === request.actualDistanceMetres) &&
      (request.actualDurationSeconds === undefined ||
        runCurrent.actualDurationSeconds === request.actualDurationSeconds)
    );
  }

  private async findForTransition(id: string): Promise<TrainingSession> {
    return this.findById(id);
  }

  private runTargetsEqual(
    current: RunTrainingSession,
    request: Extract<EditTrainingSessionRequest, { activityType: "RUN" }>,
  ) {
    return (
      current.targetDistanceMetres === request.targetDistanceMetres &&
      current.targetDurationSeconds === request.targetDurationSeconds
    );
  }
}
