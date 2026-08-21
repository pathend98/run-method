import { format, isValid, parseISO } from "date-fns";

export function parseDateFromString(value: string): Date | null {
  const parsed = parseISO(value);

  if (!isValid(parsed) || format(parsed, "yyyy-MM-dd") !== value) {
    return null;
  }

  return parsed;
}
