import { render, screen, within } from "@testing-library/react";

import type { StrengthTrainingSession } from "@/domain/training-sessions";
import { StrengthActivityDetails } from "./strength-activity-details";

function strengthActivity(
  override: Partial<StrengthTrainingSession> = {},
): StrengthTrainingSession {
  return {
    id: "strength",
    title: "Strength",
    status: "SCHEDULED",
    date: "2026-08-17",
    timeOfDay: "PM",
    description: "Full body",
    sortOrder: 0,
    skipReason: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T11:30:00.000Z",
    activityType: "STRENGTH",
    targetDurationSeconds: 2700,
    actualDurationSeconds: 2400,
    ...override,
  };
}

test("renders scheduled strength targets without recorded actual duration", () => {
  render(<StrengthActivityDetails activity={strengthActivity()} />);
  const plannedMetrics = screen.getByLabelText("Planned activity metrics");
  expect(within(plannedMetrics).queryByText("PM")).toBeNull();
  expect(screen.queryByRole("heading", { name: "Details" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Recorded metrics" })).toBeNull();
  expect(screen.getByText("00:45:00")).toBeDefined();
  expect(screen.queryByText("Actual duration")).toBeNull();
  expect(screen.queryByText("00:40:00")).toBeNull();
});

test("prioritizes completed strength actual duration and keeps its target secondary", () => {
  render(
    <StrengthActivityDetails
      activity={strengthActivity({ status: "COMPLETED" })}
    />,
  );

  const completedMetrics = screen.getByLabelText("Completed activity metrics");
  const durationCard = within(completedMetrics)
    .getByText("Actual duration")
    .closest("div");

  expect(screen.queryByLabelText("Planned activity metrics")).toBeNull();
  expect(within(completedMetrics).getByText("00:40:00")).toBeDefined();
  expect(within(completedMetrics).getByText("Target: 00:45:00")).toBeDefined();
  expect(completedMetrics.classList.contains("gap-8")).toBe(true);
  expect(durationCard?.classList.contains("bg-teal-50")).toBe(false);
  expect(durationCard?.classList.contains("border")).toBe(false);
  expect(durationCard?.classList.contains("rounded-lg")).toBe(false);
  expect(durationCard?.classList.contains("p-3")).toBe(false);
  expect(durationCard?.querySelector("dd")?.classList.contains("text-2xl")).toBe(
    true,
  );
  expect(screen.queryByText("Actual duration")).toBeDefined();
});

test("shows no target duration as secondary completed strength information", () => {
  render(
    <StrengthActivityDetails
      activity={strengthActivity({
        status: "COMPLETED",
        targetDurationSeconds: null,
      })}
    />,
  );

  const completedMetrics = screen.getByLabelText("Completed activity metrics");
  expect(
    within(completedMetrics).getByText("Target: No target duration"),
  ).toBeDefined();
});

test("renders missing planned values and omits a missing actual duration", () => {
  render(
    <StrengthActivityDetails
      activity={strengthActivity({
        actualDurationSeconds: null,
        targetDurationSeconds: null,
        timeOfDay: null,
      })}
    />,
  );
  const plannedMetrics = screen.getByLabelText("Planned activity metrics");
  expect(within(plannedMetrics).queryByText("Any time")).toBeNull();
  expect(screen.getByText("No target duration")).toBeDefined();
  expect(screen.queryByText("Actual duration")).toBeNull();
});
