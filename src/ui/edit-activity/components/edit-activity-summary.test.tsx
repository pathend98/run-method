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
  targetType: "DISTANCE_PACE",
  targetDistanceMetres: 6000,
  targetDurationSeconds: null,
  targetPaceSecondsPerKilometre: 255,
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

test("renders scheduled run discriminators without locked targets", () => {
  render(<EditActivitySummary activity={runActivity} />);

  expect(screen.getByText("Run")).toBeDefined();
  expect(screen.getByText("Scheduled")).toBeDefined();
  expect(screen.getByText("Distance + Pace")).toBeDefined();
  expect(screen.queryByText("Target details")).toBeNull();
  expect(screen.queryByText("Time of day")).toBeNull();
});

test.each([
  {
    ...runActivity,
    status: "COMPLETED" as const,
    timeOfDay: null,
    targetType: "DISTANCE_DURATION" as const,
    targetDurationSeconds: 1800,
    targetPaceSecondsPerKilometre: null,
  },
  {
    ...runActivity,
    status: "SKIPPED" as const,
    skipReason: "Rest",
    targetType: "DURATION_PACE" as const,
    targetDistanceMetres: null,
    targetDurationSeconds: 1800,
  },
])("renders terminal run timing and locked targets", (activity) => {
  render(<EditActivitySummary activity={activity} />);

  expect(screen.getByText("Time of day")).toBeDefined();
  expect(
    screen.getByText(/6\.0 km · 30 min|30 min · 4:15 \/ km/),
  ).toBeDefined();
});

test("renders strength duration and a clear missing-duration fallback", () => {
  const { rerender } = render(
    <EditActivitySummary activity={strengthActivity} />,
  );
  expect(screen.getByText("45 min")).toBeDefined();

  rerender(
    <EditActivitySummary
      activity={{ ...strengthActivity, targetDurationSeconds: null }}
    />,
  );
  expect(screen.getByText("No target duration")).toBeDefined();
});
