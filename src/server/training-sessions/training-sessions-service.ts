import { ForbiddenError } from "@/server/errors/forbidden-error";
import type {
  CompleteTrainingSessionRequest,
  SkipTrainingSessionRequest,
  CreateTrainingSessionRequest,
  EditTrainingSessionRequest,
  RunTrainingSession,
  TrainingSession,
  TrainingSessionsQueryInput,
} from "@/domain/training-sessions";
import {
  TrainingSessionNotFoundError,
  TrainingSessionsValidationError,
} from "./training-sessions-errors";
import type { TrainingSessionsRepository } from "./training-sessions-repository";
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
    request: CreateTrainingSessionRequest,
  ): Promise<TrainingSession>;
  delete(actorId: string, id: string): Promise<void>;
  skip(
    actorId: string,
    id: string,
    request: SkipTrainingSessionRequest,
    timeZone: string | null,
  ): Promise<TrainingSession>;
  complete(
    actorId: string,
    id: string,
    request: CompleteTrainingSessionRequest,
    timeZone: string | null,
  ): Promise<TrainingSession>;
  edit(
    actorId: string,
    id: string,
    request: EditTrainingSessionRequest,
  ): Promise<TrainingSession>;
}

export type CreateTrainingSessionInput = CreateTrainingSessionRequest & {
  athleteId: string;
};

export class DefaultTrainingSessionsService implements TrainingSessionsService {
  constructor(
    private readonly repository: TrainingSessionsRepository,
    private readonly validator: TrainingSessionsValidator,
    private readonly userService: Pick<UserService, "findById">,
  ) {}

  async find(
    actorId: string,
    query: TrainingSessionsQueryInput,
  ): Promise<TrainingSession[]> {
    this.authorizeAthlete(actorId, query.athleteId);
    return this.repository.find(query);
  }

  async create(
    actorId: string,
    athleteId: string,
    request: CreateTrainingSessionRequest,
  ): Promise<TrainingSession> {
    this.authorizeAthlete(actorId, athleteId);
    await this.userService.findById(athleteId);
    return this.repository.create({ ...request, athleteId });
  }

  async findById(actorId: string, id: string): Promise<TrainingSession> {
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
    request: SkipTrainingSessionRequest,
    timeZone: string | null,
  ): Promise<TrainingSession> {
    const current = await this.findById(actorId, id);
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
    request: CompleteTrainingSessionRequest,
    timeZone: string | null,
  ): Promise<TrainingSession> {
    const current = await this.findById(actorId, id);
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
    request: EditTrainingSessionRequest,
  ): Promise<TrainingSession> {
    const current = await this.findById(actorId, id);

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
