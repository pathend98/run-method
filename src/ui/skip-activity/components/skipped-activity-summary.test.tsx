import { render, screen } from "@testing-library/react";

import { SkippedActivitySummary } from "./skipped-activity-summary";

const activity = {
  id: "run",
  title: "Easy run",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: null,
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  activityType: "RUN",
  targetDistanceMetres: 8000,
  targetDurationSeconds: 2400,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
} as const;

test("shows planned run metrics with a human-readable duration", () => {
  render(<SkippedActivitySummary activity={activity} />);
  expect(screen.getByText("8.0 km · 40m · 5:00 / km")).toBeDefined();
});

test("shows strength duration without run metrics", () => {
  render(
    <SkippedActivitySummary
      activity={{
        ...activity,
        activityType: "STRENGTH",
        targetDurationSeconds: 1800,
      }}
    />,
  );
  expect(screen.getByText("30m")).toBeDefined();
  expect(screen.queryByText(/km/)).toBeNull();
});

test("omits metrics for strength activities without a target duration", () => {
  const { container } = render(
    <SkippedActivitySummary
      activity={{
        ...activity,
        activityType: "STRENGTH",
        targetDurationSeconds: null,
      }}
    />,
  );
  expect(container.childElementCount).toBe(0);
});
