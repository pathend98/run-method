import { render, screen } from "@testing-library/react";

import {
  createRunActivity,
  createStrengthActivity,
} from "@/test-support/fixtures/activity";
import { SkippedActivitySummary } from "./skipped-activity-summary";

const activity = createRunActivity({
  id: "run",
  title: "Easy run",
  timeOfDay: null,
  targetDurationSeconds: 2400,
});

test("shows planned run metrics with a human-readable duration", () => {
  render(<SkippedActivitySummary activity={activity} />);
  expect(screen.getByText("8.00 km · 40m · 5:00 / km")).toBeDefined();
});

test("shows strength duration without run metrics", () => {
  render(
    <SkippedActivitySummary
      activity={createStrengthActivity({
        id: activity.id,
        title: activity.title,
        timeOfDay: activity.timeOfDay,
        targetDurationSeconds: 1800,
      })}
    />,
  );
  expect(screen.getByText("30m")).toBeDefined();
  expect(screen.queryByText(/km/)).toBeNull();
});

test("omits metrics for strength activities without a target duration", () => {
  const { container } = render(
    <SkippedActivitySummary
      activity={createStrengthActivity({
        id: activity.id,
        title: activity.title,
        timeOfDay: activity.timeOfDay,
        targetDurationSeconds: null,
      })}
    />,
  );
  expect(container.childElementCount).toBe(0);
});
