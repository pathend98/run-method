import { parseDateFromString } from "@/core/date/date-parsing";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import type {
  CreateTrainingSessionRequest,
  EditTrainingSessionRequest,
  RunTrainingSession,
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
import type { TrainingSessionsRequestValidator } from "./training-sessions-request-validator";
import type { TrainingSessionsValidator } from "./training-sessions-validator";
import type { UserService } from "../user/user-service";

export interface TrainingSessionsService {
  find(
    actorId: string,
    query: TrainingSessionsQueryInput,
  ): Promise<TrainingSession[]>;
  findById(actorId: string, id: string): Promise<TrainingSession>;
  create(
    actorId: string,
    athleteId: string,
    body: unknown,
  ): Promise<TrainingSession>;
  delete(actorId: string, id: string): Promise<void>;
  skip(
    actorId: string,
    id: string,
    body: unknown,
    timeZone: string | null,
  ): Promise<TrainingSession>;
  complete(
    actorId: string,
    id: string,
    body: unknown,
    timeZone: string | null,
  ): Promise<TrainingSession>;
  edit(actorId: string, id: string, body: unknown): Promise<TrainingSession>;
}

export type CreateTrainingSessionInput = CreateTrainingSessionRequest & {
  athleteId: string;
};

export type TrainingSessionsQueryInput = {
  athleteId: string;
  from?: string;
  to?: string;
  status?: string;
};

export class DefaultTrainingSessionsService implements TrainingSessionsService {
  constructor(
    private readonly repository: TrainingSessionsRepository,
    private readonly validator: TrainingSessionsValidator,
    private readonly userService: Pick<UserService, "findById">,
    private readonly requestValidator: TrainingSessionsRequestValidator,
  ) {}

  async find(
    actorId: string,
    query: TrainingSessionsQueryInput,
  ): Promise<TrainingSession[]> {
    const { athleteId, from, to, status } = query;
    this.authorizeAthlete(actorId, athleteId);
    if (!trainingSessionIdSchema.safeParse(athleteId).success) {
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
      athleteId,
      ...(from !== undefined ? { from } : {}),
      ...(to !== undefined ? { to } : {}),
      ...(statusResult?.success ? { status: statusResult.data } : {}),
    };
    return this.repository.find(validQuery);
  }

  async create(
    actorId: string,
    athleteId: string,
    body: unknown,
  ): Promise<TrainingSession> {
    this.authorizeAthlete(actorId, athleteId);
    const request = this.requestValidator.validateCreate(body);
    if (!trainingSessionIdSchema.safeParse(athleteId).success) {
      throw new TrainingSessionsValidationError(
        "athlete id must be a valid UUID",
      );
    }
    await this.userService.findById(athleteId);
    return this.repository.create({ ...request, athleteId });
  }

  async findById(actorId: string, id: string): Promise<TrainingSession> {
    if (!trainingSessionIdSchema.safeParse(id).success) {
      throw new TrainingSessionsValidationError(
        "training session id must be a valid UUID",
      );
    }

    const session = await this.repository.findById(id);
    if (!session) throw new TrainingSessionNotFoundError();
    this.authorizeAthlete(actorId, session.athleteId);
    return session;
  }

  async delete(actorId: string, id: string): Promise<void> {
    await this.findById(actorId, id);
    const deleted = await this.repository.deleteById(id);
    if (!deleted) throw new TrainingSessionNotFoundError();
  }

  async skip(
    actorId: string,
    id: string,
    body: unknown,
    timeZone: string | null,
  ): Promise<TrainingSession> {
    const current = await this.findById(actorId, id);
    const request = this.requestValidator.validateSkip(body);
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
    actorId: string,
    id: string,
    body: unknown,
    timeZone: string | null,
  ): Promise<TrainingSession> {
    const current = await this.findById(actorId, id);
    const request = this.requestValidator.validateComplete(body);
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
    actorId: string,
    id: string,
    body: unknown,
  ): Promise<TrainingSession> {
    const current = await this.findById(actorId, id);
    const request = this.requestValidator.validateEdit(body);

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

  private authorizeAthlete(actorId: string, athleteId: string): void {
    if (actorId !== athleteId) throw new ForbiddenError();
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
