import { createStrengthActivity } from "@/test-support/fixtures/activity";
import { render, screen } from "@testing-library/react";

import type { StrengthTrainingSession } from "@/domain/training-sessions";
import { TrainingSessionDetailsBody } from "./training-session-details-body";

const activity = createStrengthActivity({
  id: "strength",
  status: "SKIPPED",
  timeOfDay: "PM",
  description: "Single-leg stability",
  skipReason: "Travel day",
  updatedAt: "2026-08-01T11:30:00.000Z",
}) satisfies StrengthTrainingSession;

test("renders the skip reason before planned metrics and description", () => {
  render(
    <TrainingSessionDetailsBody
      trainingSession={activity}
      plannedMetrics={<p>Planned metrics</p>}
    />,
  );
  const planned = screen.getByText("Planned metrics");
  const description = screen.getByRole("heading", {
    level: 3,
    name: "Description",
  });
  const skipReason = screen.getByRole("heading", {
    level: 3,
    name: "Why it was skipped",
  });
  expect(skipReason.compareDocumentPosition(planned)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(planned.compareDocumentPosition(description)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(screen.getByText("Single-leg stability")).toBeDefined();
  expect(screen.queryByRole("heading", { name: "Details" })).toBeNull();
  expect(screen.getByText("Travel day")).toBeDefined();
});

test("omits the description section and absent skip metadata when unavailable", () => {
  render(
    <TrainingSessionDetailsBody
      trainingSession={{
        ...activity,
        description: null,
        skipReason: null,
        status: "SCHEDULED",
        timeOfDay: null,
      }}
      plannedMetrics={null}
    />,
  );
  expect(
    screen.queryByRole("heading", { level: 3, name: "Description" }),
  ).toBeNull();
  expect(screen.queryByText("No description")).toBeNull();
  expect(
    screen.queryByRole("heading", { name: "Recorded metrics" }),
  ).toBeNull();
  expect(screen.queryByText("Why it was skipped")).toBeNull();
});
