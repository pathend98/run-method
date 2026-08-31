import { render, screen } from "@testing-library/react";

import type { StrengthTrainingSession } from "@/domain/training-sessions";
import { ActivityDetailsBody } from "./activity-details-body";

const activity = {
  id: "strength",
  title: "Strength",
  status: "SKIPPED",
  date: "2026-08-17",
  timeOfDay: "PM",
  description: "Single-leg stability",
  sortOrder: 0,
  skipReason: "Travel day",
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T11:30:00.000Z",
  activityType: "STRENGTH",
  targetDurationSeconds: 2700,
  actualDurationSeconds: null,
} satisfies StrengthTrainingSession;

test("renders shared metadata between planned and detail metrics", () => {
  render(
    <ActivityDetailsBody
      activity={activity}
      detailMetrics={<p>Actual metrics</p>}
      plannedMetrics={<p>Planned metrics</p>}
    />,
  );
  const planned = screen.getByText("Planned metrics");
  const description = screen.getByRole("heading", {
    level: 3,
    name: "Description",
  });
  const details = screen.getByRole("heading", { level: 3, name: "Details" });
  const actual = screen.getByText("Actual metrics");
  expect(planned.compareDocumentPosition(description)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(description.compareDocumentPosition(details)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(details.compareDocumentPosition(actual)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(screen.getByText("Single-leg stability")).toBeDefined();
  expect(screen.getByText("Skipped")).toBeDefined();
  expect(screen.getByText("Strength")).toBeDefined();
  expect(screen.getByText("Skip reason")).toBeDefined();
  expect(screen.getByText("Travel day")).toBeDefined();
});

test("renders the description fallback and omits absent skip metadata", () => {
  render(
    <ActivityDetailsBody
      activity={{
        ...activity,
        description: null,
        skipReason: null,
        status: "SCHEDULED",
      }}
      detailMetrics={null}
      plannedMetrics={null}
    />,
  );
  expect(screen.getByText("No description")).toBeDefined();
  expect(screen.getByText("Scheduled")).toBeDefined();
  expect(screen.queryByText("Skip reason")).toBeNull();
});
