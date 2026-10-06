import { format, parseISO } from "date-fns";
import type { TrainingSessionDateRange } from "@/domain/training-sessions";

export function formatWeekRange(weekRange: TrainingSessionDateRange) {
  const monday = parseISO(weekRange.from);
  const sunday = parseISO(weekRange.to);

  return `${format(monday, "d MMM")} – ${format(sunday, "d MMM")}`;
}

export function formatDayDate(date: string) {
  return format(parseISO(date), "d MMM");
}
