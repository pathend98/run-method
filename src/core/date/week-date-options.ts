import { addDays, format, parseISO, startOfWeek } from "date-fns";

export type WeekDateOption = {
  label: string;
  value: string;
};

export function getWeekDateOptions(date: string): WeekDateOption[] {
  const weekStart = startOfWeek(parseISO(date), { weekStartsOn: 1 });

  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(weekStart, index);
    return {
      label: format(day, "EEEE d MMM"),
      value: format(day, "yyyy-MM-dd"),
    };
  });
}
