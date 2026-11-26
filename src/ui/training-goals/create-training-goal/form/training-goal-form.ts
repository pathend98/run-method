import { createTrainingGoalRequestSchema } from "@/domain/training-goals";
import type { CreateTrainingGoalRequest } from "@/domain/training-goals";

export const trainingGoalFormSchema = createTrainingGoalRequestSchema;

export const defaultTrainingGoalFormValues: CreateTrainingGoalRequest = {
  title: "",
  purpose: "",
  trainingIntentions: "",
  startDate: "",
  targetDate: "",
};
