import {
  createTrainingGoalRequestSchema,
  editTrainingGoalRequestSchema,
  type CreateTrainingGoalRequest,
  type EditTrainingGoalRequest,
  type TrainingGoal,
} from "@/domain/training-goals";
import { RequestValidationError } from "@/server/errors/request-validation-error";
import { TrainingGoalOverlapError } from "./training-goals-errors";

export interface TrainingGoalsValidator {
  validateCreate(
    request: CreateTrainingGoalRequest,
    outstanding: TrainingGoal[],
  ): CreateTrainingGoalRequest;
  validateEdit(
    current: TrainingGoal,
    request: EditTrainingGoalRequest,
    outstanding: TrainingGoal[],
  ): CreateTrainingGoalRequest;
}

export class DefaultTrainingGoalsValidator implements TrainingGoalsValidator {
  validateCreate(
    request: CreateTrainingGoalRequest,
    outstanding: TrainingGoal[],
  ): CreateTrainingGoalRequest {
    const fields = this.validateFields(request);
    this.validateOverlap(fields, outstanding);
    return fields;
  }

  validateEdit(
    current: TrainingGoal,
    request: EditTrainingGoalRequest,
    outstanding: TrainingGoal[],
  ): CreateTrainingGoalRequest {
    const result = editTrainingGoalRequestSchema.safeParse(request);
    if (!result.success) {
      throw new RequestValidationError(result.error.flatten().fieldErrors);
    }
    const fields = this.validateFields({
      title: result.data.title ?? current.title,
      purpose: result.data.purpose ?? current.purpose,
      trainingIntentions:
        result.data.trainingIntentions ?? current.trainingIntentions,
      startDate: result.data.startDate ?? current.startDate,
      targetDate: result.data.targetDate ?? current.targetDate,
    });
    this.validateOverlap(fields, outstanding, current.id);
    return fields;
  }

  private validateFields(
    request: CreateTrainingGoalRequest,
  ): CreateTrainingGoalRequest {
    const result = createTrainingGoalRequestSchema.safeParse(request);
    if (!result.success) {
      throw new RequestValidationError(result.error.flatten().fieldErrors);
    }
    return result.data;
  }

  private validateOverlap(
    period: CreateTrainingGoalRequest,
    outstanding: TrainingGoal[],
    excludedId?: string,
  ): void {
    if (
      outstanding.some(
        (goal) =>
          goal.resolution === null &&
          goal.id !== excludedId &&
          goal.startDate <= period.targetDate &&
          goal.targetDate >= period.startDate,
      )
    ) {
      throw new TrainingGoalOverlapError();
    }
  }
}
