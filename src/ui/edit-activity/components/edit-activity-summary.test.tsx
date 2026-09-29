import { render, screen } from "@testing-library/react";

import type { RunTrainingSession } from "@/domain/training-sessions";
import {
  createRunActivity,
  createStrengthActivity,
} from "@/test-support/fixtures/activity";
import { EditActivitySummary } from "./edit-activity-summary";
import { DistanceDisplayProvider } from "@/ui/users/measurement-unit-context";

const runActivity = createRunActivity({
  description: "Controlled effort",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1530,
}) satisfies RunTrainingSession;

const strengthActivity = createStrengthActivity({
  id: "22222222-2222-4222-8222-222222222222",
  description: runActivity.description,
});

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
  expect(screen.getByText(/6\.00 km · 30m|5\.00 km · 30m/)).toBeDefined();
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

test("shows locked run targets in miles", () => {
  render(
    <DistanceDisplayProvider measurementUnit="MILES">
      <EditActivitySummary activity={{ ...runActivity, status: "COMPLETED" }} />
    </DistanceDisplayProvider>,
  );
  expect(screen.getByText("3.73 mi · 25m 30s")).toBeDefined();
});

test("hides the editable target duration for scheduled strength activities", () => {
  render(<EditActivitySummary activity={strengthActivity} />);

  expect(screen.queryByText("Target details")).toBeNull();
  expect(screen.queryByText("45m")).toBeNull();
});

test("renders locked strength duration and a clear missing-duration fallback", () => {
  const { rerender } = render(
    <EditActivitySummary
      activity={{ ...strengthActivity, status: "COMPLETED" }}
    />,
  );
  expect(screen.getByText("45m")).toBeDefined();

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
