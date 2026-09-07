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

  expect(screen.getByText("0.0 km completed")).toBeDefined();
  expect(screen.getByText("5.0 km scheduled")).toBeDefined();
  expect(screen.getByText("0 skipped · 0 due · 1 upcoming")).toBeDefined();
});

test("renders only scheduled values for a future week", () => {
  vi.setSystemTime(new Date(2026, 7, 16, 12));
  render(
    <WeeklySummary
      activities={[activity]}
      weekRange={{ from: "2026-08-17", to: "2026-08-23" }}
    />,
  );

  expect(screen.queryByText("0.0 km completed")).toBeNull();
  expect(screen.getByText("1 scheduled")).toBeDefined();
});
