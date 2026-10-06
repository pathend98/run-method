import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { parseDateFromString } from "@/core/date/date-parsing";
import type { TrainingSessionDateRange } from "@/domain/training-sessions";

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

function getWeekRange(date: Date): TrainingSessionDateRange {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  const sunday = addDays(monday, 6);

  return {
    from: format(monday, "yyyy-MM-dd"),
    to: format(sunday, "yyyy-MM-dd"),
  };
}
