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

export type TrainingActivity = TrainingSession & {
  day: Weekday;
};

export type TrainingDay = {
  day: Weekday;
  date?: string;
  activities: TrainingActivity[];
};
