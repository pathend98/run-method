import { z } from "zod";

export type DurationFields = {
  durationHours: string;
  durationMinutes: string;
  durationSeconds: string;
};

const nonNegativeInteger = z.string().regex(/^\d+$/, "Enter a whole number");
const minuteOrSecond = nonNegativeInteger.refine(
  (value) => Number(value) <= 59,
  "Enter a value from 00 to 59",
);

export const durationFieldsSchema = z.object({
  durationHours: nonNegativeInteger,
  durationMinutes: minuteOrSecond,
  durationSeconds: minuteOrSecond,
});

export const defaultDurationFields: DurationFields = {
  durationHours: "00",
  durationMinutes: "00",
  durationSeconds: "00",
};

export function durationFieldsToSeconds(fields: DurationFields) {
  return (
    Number(fields.durationHours) * 60 * 60 +
    Number(fields.durationMinutes) * 60 +
    Number(fields.durationSeconds)
  );
}

export function durationSecondsToFields(
  durationSeconds: number | null,
): DurationFields {
  if (durationSeconds === null) return defaultDurationFields;

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  return {
    durationHours: String(hours).padStart(2, "0"),
    durationMinutes: String(minutes).padStart(2, "0"),
    durationSeconds: String(seconds).padStart(2, "0"),
  };
}
