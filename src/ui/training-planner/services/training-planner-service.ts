import { addDays, format, parseISO, startOfWeek } from "date-fns";

import type {
  TrainingSession,
  TrainingSessionDateRange,
} from "@/domain/training-sessions";
import type {
  TrainingActivity,
  TrainingDay,
  Weekday,
} from "../types/training-planner-types";

const weekdays: Weekday[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function getCurrentWeekRange(now = new Date()) {
  const monday = startOfWeek(now, { weekStartsOn: 1 });
  const sunday = addDays(monday, 6);

  return {
    from: format(monday, "yyyy-MM-dd"),
    to: format(sunday, "yyyy-MM-dd"),
  };
}

export function groupSessionsByWeekday(
  sessions: TrainingSession[],
  weekRange: TrainingSessionDateRange,
): TrainingDay[] {
  const activitiesByDate = new Map<string, TrainingActivity[]>();

  for (const session of sessions) {
    const date = new Date(`${session.date}T00:00:00`);
    const day = format(date, "EEEE") as Weekday;
    const activities = activitiesByDate.get(session.date) ?? [];
    activities.push({
      ...session,
      day,
    });
    activitiesByDate.set(session.date, activities);
  }

  const monday = parseISO(weekRange.from);

  return weekdays.map((day, index) => {
    const date = format(addDays(monday, index), "yyyy-MM-dd");
    return {
      day,
      date,
      activities: activitiesByDate.get(date) ?? [],
    };
  });
}
