import { render, screen } from "@testing-library/react";

import type { RunTrainingSession } from "@/domain/training-sessions";
import { RunActivityDetails } from "./run-activity-details";

// Loosen the discriminated union's correlated target fields for partial test overrides.
type RunOverride = Omit<
  Partial<RunTrainingSession>,
  | "targetDistanceMetres"
  | "targetDurationSeconds"
  | "targetPaceSecondsPerKilometre"
  | "targetType"
> & {
  targetDistanceMetres?: number | null;
  targetDurationSeconds?: number | null;
  targetPaceSecondsPerKilometre?: number | null;
  targetType?: "DISTANCE_DURATION" | "DISTANCE_PACE" | "DURATION_PACE";
};

function runActivity(override: RunOverride = {}): RunTrainingSession {
  return {
    id: "run",
    title: "Tempo run",
    status: "SCHEDULED",
    date: "2026-08-17",
    timeOfDay: "AM",
    description: "Controlled effort",
    sortOrder: 0,
    skipReason: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T11:30:00.000Z",
    activityType: "RUN",
    targetType: "DISTANCE_PACE",
    targetDistanceMetres: 6000,
    targetDurationSeconds: null,
    targetPaceSecondsPerKilometre: 255,
    actualDistanceMetres: 5900,
    actualDurationSeconds: 1500,
    ...override,
  } as RunTrainingSession;
}

test("renders full run targets and actual values", () => {
  render(<RunActivityDetails activity={runActivity()} />);
  expect(screen.getByText("AM")).toBeDefined();
  expect(screen.getByText("6.0 km")).toBeDefined();
  expect(screen.getByText("26 min")).toBeDefined();
  expect(screen.getByText("4:15 / km")).toBeDefined();
  expect(screen.getByText("Distance + Pace")).toBeDefined();
  expect(screen.getByText("5.9 km")).toBeDefined();
  expect(screen.getByText("25 min")).toBeDefined();
});

test.each([
  {
    expectedTarget: "Distance + Duration",
    expectedDerivedTarget: "6:40 / km",
    expectedDuration: "40 min",
    override: {
      targetType: "DISTANCE_DURATION",
      targetDurationSeconds: 2400,
      targetPaceSecondsPerKilometre: null,
    },
  },
  {
    expectedTarget: "Duration + Pace",
    expectedDerivedTarget: "7.1 km",
    expectedDuration: "30 min",
    override: {
      targetType: "DURATION_PACE",
      targetDistanceMetres: null,
      targetDurationSeconds: 1800,
    },
  },
] satisfies Array<{
  expectedTarget: string;
  expectedDerivedTarget: string;
  expectedDuration: string;
  override: RunOverride;
}>)(
  "$expectedTarget",
  ({ expectedDerivedTarget, expectedDuration, expectedTarget, override }) => {
    render(<RunActivityDetails activity={runActivity(override)} />);
    expect(screen.getByText(expectedTarget)).toBeDefined();
    expect(screen.getByText(expectedDuration)).toBeDefined();
    expect(screen.getByText(expectedDerivedTarget)).toBeDefined();
  },
);

test("renders missing planned values and no actual metrics", () => {
  render(
    <RunActivityDetails
      activity={runActivity({
        actualDistanceMetres: null,
        actualDurationSeconds: null,
        targetDistanceMetres: null,
        targetDurationSeconds: null,
        targetPaceSecondsPerKilometre: null,
        targetType: "DURATION_PACE",
        timeOfDay: null,
      })}
    />,
  );
  expect(screen.getByText("Any time")).toBeDefined();
  expect(screen.getByText("No target distance")).toBeDefined();
  expect(screen.getByText("No target duration")).toBeDefined();
  expect(screen.getByText("No target pace")).toBeDefined();
  expect(screen.queryByText("Actual distance")).toBeNull();
  expect(screen.queryByText("Actual duration")).toBeNull();
});

test.each([
  ["distance", { actualDurationSeconds: null }, "Actual distance"],
  ["duration", { actualDistanceMetres: null }, "Actual duration"],
] satisfies Array<[string, RunOverride, string]>)(
  "renders actual %s independently",
  (_name, override, expectedLabel) => {
    render(<RunActivityDetails activity={runActivity(override)} />);
    expect(screen.getByText(expectedLabel)).toBeDefined();
    expect(
      screen.queryByText(
        expectedLabel === "Actual distance"
          ? "Actual duration"
          : "Actual distance",
      ),
    ).toBeNull();
  },
);
