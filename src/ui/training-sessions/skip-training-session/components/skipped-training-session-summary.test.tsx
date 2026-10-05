import { render, screen } from "@testing-library/react";

import {
  createRunTrainingSession,
  createStrengthTrainingSession,
} from "@/test-support/fixtures/training-session";
import { SkippedTrainingSessionSummary } from "./skipped-training-session-summary";
import { DistanceDisplayProvider } from "@/ui/users/measurement-unit-context";

const trainingSession = createRunTrainingSession({
  id: "run",
  title: "Easy run",
  timeOfDay: null,
  targetDurationSeconds: 2400,
});

test("shows planned run metrics with a human-readable duration", () => {
  render(<SkippedTrainingSessionSummary trainingSession={trainingSession} />);
  expect(screen.getByText("8.00 km · 40m · 5:00 / km")).toBeDefined();
});

test("shows the planned run distance and pace in miles", () => {
  render(
    <DistanceDisplayProvider measurementUnit="MILES">
      <SkippedTrainingSessionSummary trainingSession={trainingSession} />
    </DistanceDisplayProvider>,
  );
  expect(screen.getByText("4.97 mi · 40m · 8:03 / mi")).toBeDefined();
});

test("shows strength duration without run metrics", () => {
  render(
    <SkippedTrainingSessionSummary
      trainingSession={createStrengthTrainingSession({
        id: trainingSession.id,
        title: trainingSession.title,
        timeOfDay: trainingSession.timeOfDay,
        targetDurationSeconds: 1800,
      })}
    />,
  );
  expect(screen.getByText("30m")).toBeDefined();
  expect(screen.queryByText(/km/)).toBeNull();
});

test("omits metrics for strength activities without a target duration", () => {
  const { container } = render(
    <SkippedTrainingSessionSummary
      trainingSession={createStrengthTrainingSession({
        id: trainingSession.id,
        title: trainingSession.title,
        timeOfDay: trainingSession.timeOfDay,
        targetDurationSeconds: null,
      })}
    />,
  );
  expect(container.childElementCount).toBe(0);
});
