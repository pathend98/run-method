import { render, screen, within } from "@testing-library/react";

import type { StrengthTrainingSession } from "@/domain/training-sessions";
import { createStrengthActivity } from "@/test-support/fixtures/activity";
import { StrengthActivityDetails } from "./strength-activity-details";

function strengthActivity(
  override: Partial<StrengthTrainingSession> = {},
): StrengthTrainingSession {
  return createStrengthActivity({
    id: "strength",
    timeOfDay: "PM",
    description: "Full body",
    updatedAt: "2026-08-01T11:30:00.000Z",
    actualDurationSeconds: 2400,
    ...override,
  });
}

test("renders scheduled strength targets without recorded actual duration", () => {
  render(<StrengthActivityDetails activity={strengthActivity()} />);
  const plannedMetrics = screen.getByLabelText("Planned activity metrics");
  expect(within(plannedMetrics).queryByText("PM")).toBeNull();
  expect(screen.queryByRole("heading", { name: "Details" })).toBeNull();
  expect(
    screen.queryByRole("heading", { name: "Recorded metrics" }),
  ).toBeNull();
  expect(screen.getByText("45m")).toBeDefined();
  expect(screen.queryByText("Actual duration")).toBeNull();
  expect(screen.queryByText("40m")).toBeNull();
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
  expect(within(completedMetrics).getByText("40m")).toBeDefined();
  expect(within(completedMetrics).getByText("Target: 45m")).toBeDefined();
  expect(completedMetrics.classList.contains("gap-8")).toBe(true);
  expect(durationCard?.classList.contains("bg-teal-50")).toBe(false);
  expect(durationCard?.classList.contains("border")).toBe(false);
  expect(durationCard?.classList.contains("rounded-lg")).toBe(false);
  expect(durationCard?.classList.contains("p-3")).toBe(false);
  expect(
    durationCard?.querySelector("dd")?.classList.contains("text-2xl"),
  ).toBe(true);
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
