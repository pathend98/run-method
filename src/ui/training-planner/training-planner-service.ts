import { addDays, format, startOfWeek } from "date-fns";

import type { TrainingSession } from "@/domain/training-sessions";
import type { TrainingActivity, TrainingDay, Weekday } from "./types";

export const weekdays: Weekday[] = [
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
): TrainingDay[] {
  const daysByDate = new Map<string, TrainingActivity[]>();

  for (const session of sessions) {
    const date = new Date(`${session.date}T00:00:00`);
    const day = format(date, "EEEE") as Weekday;
    const activities = daysByDate.get(day) ?? [];
    activities.push({
      id: session.id,
      title: session.title,
      activityType: session.activityType,
      day,
      timeOfDay: session.timeOfDay,
      description: session.description,
      date: session.date,
      sortOrder: session.sortOrder,
    });
    daysByDate.set(day, activities);
  }

  return weekdays.map((day) => ({
    day,
    activities: daysByDate.get(day) ?? [],
  }));
}
