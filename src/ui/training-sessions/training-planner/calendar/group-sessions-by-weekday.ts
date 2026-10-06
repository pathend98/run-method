import { addDays, format, parseISO } from "date-fns";
import type {
  TrainingSession,
  TrainingSessionDateRange,
} from "@/domain/training-sessions";
import type {
  PlannerTrainingSession,
  TrainingDay,
  Weekday,
} from "./training-calendar-types";

const weekdays: Weekday[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function groupSessionsByWeekday(
  sessions: TrainingSession[],
  weekRange: TrainingSessionDateRange,
): TrainingDay[] {
  const trainingSessionsByDate = new Map<string, PlannerTrainingSession[]>();

  for (const session of sessions) {
    const date = new Date(`${session.date}T00:00:00`);
    const day = format(date, "EEEE") as Weekday;
    const trainingSessions = trainingSessionsByDate.get(session.date) ?? [];
    trainingSessions.push({
      ...session,
      day,
    });
    trainingSessionsByDate.set(session.date, trainingSessions);
  }

  const monday = parseISO(weekRange.from);

  return weekdays.map((day, index) => {
    const date = format(addDays(monday, index), "yyyy-MM-dd");
    return {
      day,
      date,
      trainingSessions: trainingSessionsByDate.get(date) ?? [],
    };
  });
}
