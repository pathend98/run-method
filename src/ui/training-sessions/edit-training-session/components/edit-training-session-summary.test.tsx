import { render, screen } from "@testing-library/react";

import type { RunTrainingSession } from "@/domain/training-sessions";
import {
  createRunTrainingSession,
  createStrengthTrainingSession,
} from "@/test-support/fixtures/training-session";
import { EditTrainingSessionSummary } from "./edit-training-session-summary";
import { DistanceDisplayProvider } from "@/ui/users/measurement-unit-context";

const runTrainingSession = createRunTrainingSession({
  description: "Controlled effort",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1530,
}) satisfies RunTrainingSession;

const strengthTrainingSession = createStrengthTrainingSession({
  id: "22222222-2222-4222-8222-222222222222",
  description: runTrainingSession.description,
});

test("renders scheduled run summary without locked targets", () => {
  render(<EditTrainingSessionSummary trainingSession={runTrainingSession} />);

  expect(screen.getByText("Run")).toBeDefined();
  expect(screen.getByText("Scheduled")).toBeDefined();
  expect(screen.queryByText("Run target")).toBeNull();
  expect(screen.queryByText("Target details")).toBeNull();
  expect(screen.queryByText("Time of day")).toBeNull();
});

test.each([
  {
    ...runTrainingSession,
    status: "COMPLETED" as const,
    timeOfDay: null,
    targetDurationSeconds: 1800,
  },
  {
    ...runTrainingSession,
    status: "SKIPPED" as const,
    skipReason: "Rest",
    targetDistanceMetres: 5000,
    targetDurationSeconds: 1800,
  },
])("renders terminal run timing and locked targets", (trainingSession) => {
  render(<EditTrainingSessionSummary trainingSession={trainingSession} />);

  expect(screen.getByText("Time of day")).toBeDefined();
  expect(
    screen.getByText(
      trainingSession.timeOfDay === null ? "Anytime" : "Morning",
    ),
  ).toBeDefined();
  expect(screen.getByText(/6\.00 km · 30m|5\.00 km · 30m/)).toBeDefined();
});

test("formats terminal AM and PM values for display", () => {
  const { rerender } = render(
    <EditTrainingSessionSummary
      trainingSession={{ ...runTrainingSession, status: "COMPLETED" }}
    />,
  );
  expect(screen.getByText("Morning")).toBeDefined();

  rerender(
    <EditTrainingSessionSummary
      trainingSession={{
        ...runTrainingSession,
        status: "SKIPPED",
        timeOfDay: "PM",
      }}
    />,
  );
  expect(screen.getByText("Evening")).toBeDefined();
});

test("shows locked run targets in miles", () => {
  render(
    <DistanceDisplayProvider measurementUnit="MILES">
      <EditTrainingSessionSummary
        trainingSession={{ ...runTrainingSession, status: "COMPLETED" }}
      />
    </DistanceDisplayProvider>,
  );
  expect(screen.getByText("3.73 mi · 25m 30s")).toBeDefined();
});

test("hides the editable target duration for scheduled strength training sessions", () => {
  render(
    <EditTrainingSessionSummary trainingSession={strengthTrainingSession} />,
  );

  expect(screen.queryByText("Target details")).toBeNull();
  expect(screen.queryByText("45m")).toBeNull();
});

test("renders locked strength duration and a clear missing-duration fallback", () => {
  const { rerender } = render(
    <EditTrainingSessionSummary
      trainingSession={{ ...strengthTrainingSession, status: "COMPLETED" }}
    />,
  );
  expect(screen.getByText("45m")).toBeDefined();

  rerender(
    <EditTrainingSessionSummary
      trainingSession={{
        ...strengthTrainingSession,
        status: "COMPLETED",
        targetDurationSeconds: null,
      }}
    />,
  );
  expect(screen.getByText("No target duration")).toBeDefined();
});
