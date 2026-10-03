import type {
  CreateTrainingGoalRequest,
  TrainingGoal,
} from "@/domain/training-goals";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import type { TrainingGoalsRepository } from "./training-goals-repository";

export interface TrainingGoalsService {
  find(actorId: string, athleteId: string): Promise<TrainingGoal[]>;
  create(
    actorId: string,
    athleteId: string,
    request: CreateTrainingGoalRequest,
  ): Promise<TrainingGoal>;
}

export class DefaultTrainingGoalsService implements TrainingGoalsService {
  constructor(private readonly repository: TrainingGoalsRepository) {}

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
