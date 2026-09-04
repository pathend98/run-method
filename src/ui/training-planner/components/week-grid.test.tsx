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
  { day: "Monday", activities: [activity] },
  { day: "Tuesday", activities: [] },
] satisfies TrainingDay[];

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
  expect(within(planner).getByText("No activity scheduled")).toBeDefined();
});

test("passes activity selection through from day columns", () => {
  const onSelectActivity = vi.fn();

  render(<WeekGrid onSelectActivity={onSelectActivity} week={week} />);
  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );

  expect(onSelectActivity).toHaveBeenCalledWith(activity);
});
