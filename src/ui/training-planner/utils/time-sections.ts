import type { TimeOfDay } from "../types/training-planner-types";

export const timeSections: { label: string; value: TimeOfDay }[] = [
  { label: "AM", value: "AM" },
  { label: "Any time", value: null },
  { label: "PM", value: "PM" },
];
