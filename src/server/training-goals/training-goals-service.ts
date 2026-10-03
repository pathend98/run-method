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
  TrainingGoalNotActiveError,
} from "./training-goals-errors";
import type { TrainingGoalsRepository } from "./training-goals-repository";

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
  constructor(private readonly repository: TrainingGoalsRepository) {}

  async discard(actorId: string, id: string): Promise<TrainingGoal> {
    const current = await this.repository.findById(id);
    if (!current) throw new TrainingGoalNotFoundError();

    if (actorId !== current.athleteId) throw new ForbiddenError();

    if (current.status !== "ACTIVE") throw new TrainingGoalCannotDiscardError();

    const discarded = await this.repository.discard(actorId, id);
    if (!discarded) throw new TrainingGoalCannotDiscardError();

    return discarded;
  }

  async complete(actorId: string, id: string): Promise<TrainingGoal> {
    const current = await this.repository.findById(id);
    if (!current) throw new TrainingGoalNotFoundError();

    if (actorId !== current.athleteId) throw new ForbiddenError();

    if (current.status !== "ACTIVE")
      throw new TrainingGoalCannotCompleteError();

    const completed = await this.repository.complete(actorId, id);
    if (!completed) throw new TrainingGoalCannotCompleteError();

    return completed;
  }

  async edit(
    actorId: string,
    id: string,
    request: EditTrainingGoalRequest,
  ): Promise<TrainingGoal> {
    const current = await this.repository.findById(id);
    if (!current) throw new TrainingGoalNotFoundError();

    if (actorId !== current.athleteId) throw new ForbiddenError();

    if (current.status !== "ACTIVE") throw new TrainingGoalNotActiveError();

    const edited = await this.repository.edit(actorId, id, request);
    if (!edited) throw new TrainingGoalNotActiveError();

    return edited;
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
    return this.repository.create({ ...request, athleteId });
  }
}
