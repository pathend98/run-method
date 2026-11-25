import type {
  CreateTrainingGoalRequest,
  EditTrainingGoalRequest,
  TrainingGoal,
} from "@/domain/training-goals";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import {
  TrainingGoalCannotCompleteError,
  TrainingGoalCannotDiscardError,
  TrainingGoalNotFoundError,
  TrainingGoalAlreadyResolvedError,
} from "./training-goals-errors";
import type { TrainingGoalsRepository } from "./training-goals-repository";
import type { TrainingGoalsValidator } from "./training-goals-validator";

export interface TrainingGoalsService {
  discard(actorId: string, id: string): Promise<TrainingGoal>;
  complete(actorId: string, id: string): Promise<TrainingGoal>;
  edit(
    actorId: string,
    id: string,
    request: EditTrainingGoalRequest,
  ): Promise<TrainingGoal>;
  find(actorId: string, athleteId: string): Promise<TrainingGoal[]>;
  create(
    actorId: string,
    athleteId: string,
    request: CreateTrainingGoalRequest,
  ): Promise<TrainingGoal>;
}

export class DefaultTrainingGoalsService implements TrainingGoalsService {
  constructor(
    private readonly repository: TrainingGoalsRepository,
    private readonly validator: TrainingGoalsValidator,
  ) {}

  async discard(actorId: string, id: string): Promise<TrainingGoal> {
    return this.repository.withAthleteLock(actorId, async (repository) => {
      const current = await repository.findById(id);
      if (!current) throw new TrainingGoalNotFoundError();

      if (actorId !== current.athleteId) throw new ForbiddenError();

      if (current.resolution !== null)
        throw new TrainingGoalCannotDiscardError();

      const discarded = await repository.discard(actorId, id);
      if (!discarded) throw new TrainingGoalCannotDiscardError();

      return discarded;
    });
  }

  async complete(actorId: string, id: string): Promise<TrainingGoal> {
    return this.repository.withAthleteLock(actorId, async (repository) => {
      const current = await repository.findById(id);
      if (!current) throw new TrainingGoalNotFoundError();

      if (actorId !== current.athleteId) throw new ForbiddenError();

      if (current.resolution !== null)
        throw new TrainingGoalCannotCompleteError();

      const completed = await repository.complete(actorId, id);
      if (!completed) throw new TrainingGoalCannotCompleteError();

      return completed;
    });
  }

  async edit(
    actorId: string,
    id: string,
    request: EditTrainingGoalRequest,
  ): Promise<TrainingGoal> {
    return this.repository.withAthleteLock(actorId, async (repository) => {
      const current = await repository.findById(id);
      if (!current) throw new TrainingGoalNotFoundError();

      if (actorId !== current.athleteId) throw new ForbiddenError();

      if (current.resolution !== null)
        throw new TrainingGoalAlreadyResolvedError();

      const outstanding = await repository.findUnresolved(actorId);
      const fields = this.validator.validateEdit(current, request, outstanding);
      const edited = await repository.edit(actorId, id, fields);
      if (!edited) throw new TrainingGoalAlreadyResolvedError();

      return edited;
    });
  }

  async find(actorId: string, athleteId: string): Promise<TrainingGoal[]> {
    if (actorId !== athleteId) throw new ForbiddenError();
    return this.repository.find(athleteId);
  }

  async create(
    actorId: string,
    athleteId: string,
    request: CreateTrainingGoalRequest,
  ): Promise<TrainingGoal> {
    if (actorId !== athleteId) throw new ForbiddenError();
    return this.repository.withAthleteLock(athleteId, async (repository) => {
      const outstanding = await repository.findUnresolved(athleteId);
      const fields = this.validator.validateCreate(request, outstanding);
      return repository.create({ ...fields, athleteId });
    });
  }
}
