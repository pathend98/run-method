import type { TimeOfDay } from "./types";

export const timeSections: { label: string; value: TimeOfDay }[] = [
  { label: "AM", value: "AM" },
  { label: "Any time", value: null },
  { label: "PM", value: "PM" },
];
