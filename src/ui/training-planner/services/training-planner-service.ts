import {
  addDays,
  format,
  isSameMonth,
  isSameYear,
  parseISO,
  startOfWeek,
} from "date-fns";

import { parseDateFromString } from "@/core/date/date-parsing";
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
  return getWeekRange(now);
}

export function resolveWeekRange(
  week: string | null,
  now = new Date(),
): TrainingSessionDateRange {
  const selectedDate = week ? parseDateFromString(week) : null;

  return getWeekRange(selectedDate ?? now);
}

export function getAdjacentWeekStart(
  weekRange: TrainingSessionDateRange,
  offset: -1 | 1,
) {
  return format(addDays(parseISO(weekRange.from), offset * 7), "yyyy-MM-dd");
}

export function formatWeekRange(weekRange: TrainingSessionDateRange) {
  const monday = parseISO(weekRange.from);
  const sunday = parseISO(weekRange.to);

  if (!isSameYear(monday, sunday)) {
    return `${format(monday, "d MMMM yyyy")}–${format(sunday, "d MMMM yyyy")}`;
  }

  if (!isSameMonth(monday, sunday)) {
    return `${format(monday, "d MMMM")}–${format(sunday, "d MMMM yyyy")}`;
  }

  return `${format(monday, "d")}–${format(sunday, "d MMMM yyyy")}`;
}

export function formatDayDate(date: string) {
  return format(parseISO(date), "d MMM");
}

function getWeekRange(date: Date): TrainingSessionDateRange {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
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
