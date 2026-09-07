import { render, screen } from "@testing-library/react";

import type { TrainingSession } from "@/domain/training-sessions";
import { WeeklySummary } from "./weekly-summary";

const activity: TrainingSession = {
  activityType: "RUN",
  actualDistanceMetres: null,
  actualDurationSeconds: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  date: "2026-08-22",
  description: null,
  id: "11111111-1111-4111-8111-111111111111",
  skipReason: null,
  sortOrder: 0,
  status: "SCHEDULED",
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1800,
  timeOfDay: null,
  title: "Long run",
  updatedAt: "2026-08-01T10:00:00.000Z",
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test("renders current-week completed and activity-status lines", () => {
  vi.setSystemTime(new Date(2026, 7, 20, 12));
  render(
    <WeeklySummary
      activities={[activity]}
      weekRange={{ from: "2026-08-17", to: "2026-08-23" }}
    />,
  );

  const completedDistance = screen.getByText("0.0 km");
  expect(completedDistance.classList.contains("text-2xl")).toBe(true);
  expect(completedDistance.classList.contains("font-semibold")).toBe(true);
  expect(screen.getByText("5.0 km scheduled")).toBeDefined();
  expect(screen.getByText("0m")).toBeDefined();
  const completedActivities = screen.getByText("0 completed");
  expect(completedActivities.classList.contains("text-2xl")).toBe(true);
  expect(completedActivities.classList.contains("font-semibold")).toBe(true);
  expect(screen.getByText("1 upcoming")).toBeDefined();
  expect(screen.queryByText(/due/)).toBeNull();
  expect(screen.queryByText(/skipped/)).toBeNull();
  expect(screen.getAllByRole("progressbar")).toHaveLength(2);
});

test("calculates distance and duration progress from completed actuals", () => {
  vi.setSystemTime(new Date(2026, 7, 20, 12));
  const completedActivity: TrainingSession = {
    ...activity,
    actualDistanceMetres: 2500,
    actualDurationSeconds: 900,
    date: "2026-08-20",
    status: "COMPLETED",
  };
  render(
    <WeeklySummary
      activities={[completedActivity]}
      weekRange={{ from: "2026-08-17", to: "2026-08-23" }}
    />,
  );

  expect(
    screen
      .getByRole("progressbar", { name: "Running distance progress" })
      .getAttribute("aria-valuenow"),
  ).toBe("50");
  expect(
    screen
      .getByRole("progressbar", { name: "Training time progress" })
      .getAttribute("aria-valuenow"),
  ).toBe("50");
  expect(screen.queryByText(/skipped|due|upcoming/)).toBeNull();
});

test("includes skipped activities when present", () => {
  vi.setSystemTime(new Date(2026, 7, 20, 12));
  const skippedActivity: TrainingSession = {
    ...activity,
    skipReason: "Rest day",
    status: "SKIPPED",
  };
  render(
    <WeeklySummary
      activities={[skippedActivity]}
      weekRange={{ from: "2026-08-17", to: "2026-08-23" }}
    />,
  );

  expect(screen.getByText("1 skipped")).toBeDefined();
  expect(screen.queryByText(/due/)).toBeNull();
});

test("includes due activities when present", () => {
  vi.setSystemTime(new Date(2026, 7, 20, 12));
  render(
    <WeeklySummary
      activities={[{ ...activity, date: "2026-08-20" }]}
      weekRange={{ from: "2026-08-17", to: "2026-08-23" }}
    />,
  );

  expect(screen.getByText("1 due")).toBeDefined();
});

test("renders only scheduled values for a future week", () => {
  vi.setSystemTime(new Date(2026, 7, 16, 12));
  render(
    <WeeklySummary
      activities={[activity]}
      weekRange={{ from: "2026-08-17", to: "2026-08-23" }}
    />,
  );

  expect(screen.queryByText("0.0 km")).toBeNull();
  const scheduledActivities = screen.getByText("1 scheduled");
  expect(scheduledActivities.classList.contains("text-2xl")).toBe(true);
  expect(scheduledActivities.classList.contains("font-semibold")).toBe(true);
  expect(
    screen
      .getByRole("progressbar", { name: "Running distance progress" })
      .getAttribute("aria-valuenow"),
  ).toBe("0");
  expect(
    screen
      .getByRole("progressbar", { name: "Training time progress" })
      .getAttribute("aria-valuenow"),
  ).toBe("0");
});
