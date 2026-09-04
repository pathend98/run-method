import { render, screen } from "@testing-library/react";

import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import { EditActivitySummary } from "./edit-activity-summary";

const runActivity = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Tempo run",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: "Controlled effort",
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  activityType: "RUN",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1530,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
} satisfies RunTrainingSession;

const strengthActivity = {
  ...runActivity,
  id: "22222222-2222-4222-8222-222222222222",
  title: "Strength",
  activityType: "STRENGTH",
  targetDurationSeconds: 2700,
  actualDurationSeconds: null,
} satisfies StrengthTrainingSession;

test("renders scheduled run summary without locked targets", () => {
  render(<EditActivitySummary activity={runActivity} />);

  expect(screen.getByText("Run")).toBeDefined();
  expect(screen.getByText("Scheduled")).toBeDefined();
  expect(screen.queryByText("Run target")).toBeNull();
  expect(screen.queryByText("Target details")).toBeNull();
  expect(screen.queryByText("Time of day")).toBeNull();
});

test.each([
  {
    ...runActivity,
    status: "COMPLETED" as const,
    timeOfDay: null,
    targetDurationSeconds: 1800,
  },
  {
    ...runActivity,
    status: "SKIPPED" as const,
    skipReason: "Rest",
    targetDistanceMetres: 5000,
    targetDurationSeconds: 1800,
  },
])("renders terminal run timing and locked targets", (activity) => {
  render(<EditActivitySummary activity={activity} />);

  expect(screen.getByText("Time of day")).toBeDefined();
  expect(
    screen.getByText(activity.timeOfDay === null ? "Anytime" : "Morning"),
  ).toBeDefined();
  expect(
    screen.getByText(/6\.0 km · 00:30:00|5\.0 km · 00:30:00/),
  ).toBeDefined();
});

test("formats terminal AM and PM values for display", () => {
  const { rerender } = render(
    <EditActivitySummary activity={{ ...runActivity, status: "COMPLETED" }} />,
  );
  expect(screen.getByText("Morning")).toBeDefined();

  rerender(
    <EditActivitySummary
      activity={{ ...runActivity, status: "SKIPPED", timeOfDay: "PM" }}
    />,
  );
  expect(screen.getByText("Evening")).toBeDefined();
});

test("hides the editable target duration for scheduled strength activities", () => {
  render(<EditActivitySummary activity={strengthActivity} />);

  expect(screen.queryByText("Target details")).toBeNull();
  expect(screen.queryByText("00:45:00")).toBeNull();
});

test("renders locked strength duration and a clear missing-duration fallback", () => {
  const { rerender } = render(
    <EditActivitySummary
      activity={{ ...strengthActivity, status: "COMPLETED" }}
    />,
  );
  expect(screen.getByText("00:45:00")).toBeDefined();

  rerender(
    <EditActivitySummary
      activity={{
        ...strengthActivity,
        status: "COMPLETED",
        targetDurationSeconds: null,
      }}
    />,
  );
  expect(screen.getByText("No target duration")).toBeDefined();
});
