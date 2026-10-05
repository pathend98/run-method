import { render, screen, within } from "@testing-library/react";

import type { StrengthTrainingSession } from "@/domain/training-sessions";
import { createStrengthTrainingSession } from "@/test-support/fixtures/training-session";
import { StrengthDetails } from "./strength-details";

function strengthTrainingSession(
  override: Partial<StrengthTrainingSession> = {},
): StrengthTrainingSession {
  return createStrengthTrainingSession({
    id: "strength",
    timeOfDay: "PM",
    description: "Full body",
    updatedAt: "2026-08-01T11:30:00.000Z",
    actualDurationSeconds: 2400,
    ...override,
  });
}

test("renders scheduled strength targets without recorded actual duration", () => {
  render(<StrengthDetails trainingSession={strengthTrainingSession()} />);
  const plannedMetrics = screen.getByLabelText(
    "Planned training session metrics",
  );
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
    <StrengthDetails
      trainingSession={strengthTrainingSession({ status: "COMPLETED" })}
    />,
  );

  const completedMetrics = screen.getByLabelText(
    "Completed training session metrics",
  );
  const durationCard = within(completedMetrics)
    .getByText("Actual duration")
    .closest("div");

  expect(
    screen.queryByLabelText("Planned training session metrics"),
  ).toBeNull();
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
    <StrengthDetails
      trainingSession={strengthTrainingSession({
        status: "COMPLETED",
        targetDurationSeconds: null,
      })}
    />,
  );

  const completedMetrics = screen.getByLabelText(
    "Completed training session metrics",
  );
  expect(
    within(completedMetrics).getByText("Target: No target duration"),
  ).toBeDefined();
});

test("renders missing planned values and omits a missing actual duration", () => {
  render(
    <StrengthDetails
      trainingSession={strengthTrainingSession({
        actualDurationSeconds: null,
        targetDurationSeconds: null,
        timeOfDay: null,
      })}
    />,
  );
  const plannedMetrics = screen.getByLabelText(
    "Planned training session metrics",
  );
  expect(within(plannedMetrics).queryByText("Any time")).toBeNull();
  expect(screen.getByText("No target duration")).toBeDefined();
  expect(screen.queryByText("Actual duration")).toBeNull();
});
