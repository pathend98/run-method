import { fireEvent, render, screen, within } from "@testing-library/react";
import { WeekGrid } from "./week-grid";
import type {
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";

const activity = {
  id: "activity",
  title: "Tempo run",
  activityType: "RUN",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1530,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
  day: "Monday",
} satisfies TrainingActivity;

const week = [
  { day: "Monday", date: "2026-08-17", activities: [activity] },
  { day: "Tuesday", date: "2026-08-18", activities: [] },
] satisfies TrainingDay[];

afterEach(() => {
  vi.useRealTimers();
});

test("renders a labelled weekly planner list with day columns", () => {
  render(<WeekGrid onSelectActivity={vi.fn()} week={week} />);

  const planner = screen.getByRole("list", { name: "Weekly training planner" });
  expect(planner.className).toContain("overflow-x-auto");
  expect(planner.className).toContain("rounded-lg");
  expect(planner.className).toContain("border");
  expect(planner.firstElementChild?.className).toContain("divide-x");
  expect(
    within(planner).getByRole("listitem", { name: "Monday" }),
  ).toBeDefined();
  expect(
    within(planner).getByRole("listitem", { name: "Tuesday" }),
  ).toBeDefined();
  expect(within(planner).getByText("Tempo run")).toBeDefined();
  expect(within(planner).getByText("Rest day")).toBeDefined();
});

test("passes activity selection through from day columns", () => {
  const onSelectActivity = vi.fn();

  render(<WeekGrid onSelectActivity={onSelectActivity} week={week} />);
  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );

  expect(onSelectActivity).toHaveBeenCalledWith(activity);
});

test("tints only today's column when the displayed week includes it", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-17T12:00:00"));

  render(<WeekGrid onSelectActivity={vi.fn()} week={week} />);

  const monday = screen.getByRole("listitem", { name: "Monday" });
  const tuesday = screen.getByRole("listitem", { name: "Tuesday" });
  const today = monday.querySelector('time[aria-current="date"]');

  expect(monday.className).toContain("bg-teal-100/60");
  expect(today?.textContent).toBe("17 Aug");
  expect(today?.className).toContain("text-zinc-500");
  expect(today?.className).not.toContain("rounded-full");
  expect(tuesday.className).not.toContain("bg-teal-100/60");
  expect(tuesday.querySelector('time[aria-current="date"]')).toBeNull();
});

test("does not mark a date outside the displayed week as today", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-20T12:00:00"));

  render(<WeekGrid onSelectActivity={vi.fn()} week={week} />);

  expect(document.querySelector('time[aria-current="date"]')).toBeNull();
  expect(document.querySelector('[class~="bg-teal-100/60"]')).toBeNull();
});
