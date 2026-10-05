import type { TimeOfDay, TrainingSession } from "@/domain/training-sessions";

export type { TimeOfDay };

export type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type PlannerTrainingSession = TrainingSession & {
  day: Weekday;
};

export type TrainingDay = {
  day: Weekday;
  date?: string;
  trainingSessions: PlannerTrainingSession[];
};
