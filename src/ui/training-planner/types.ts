export type TimeOfDay = "AM" | "PM" | null;

export type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type TrainingActivity = {
  id: string;
  title: string;
  activityType: string;
  day: Weekday;
  timeOfDay: TimeOfDay;
  description?: string | null;
  date?: string;
  sortOrder?: number;
};

export type TrainingDay = {
  day: Weekday;
  activities: TrainingActivity[];
};
