import { render, screen, within } from "@testing-library/react";

import type { RunTrainingSession } from "@/domain/training-sessions";
import { createRunTrainingSession } from "@/test-support/fixtures/training-session";
import { RunDetails } from "./run-details";
import { DistanceDisplayProvider } from "@/ui/users/measurement-unit-context";

type RunOverride = Partial<RunTrainingSession>;

function runActivity(override: RunOverride = {}): RunTrainingSession {
  return createRunTrainingSession({
    id: "run",
    description: "Controlled effort",
    updatedAt: "2026-08-01T11:30:00.000Z",
    targetDistanceMetres: 6000,
    targetDurationSeconds: 1530,
    actualDistanceMetres: 5900,
    actualDurationSeconds: 1500,
    ...override,
  });
}

test("renders scheduled run targets without recorded actual values", () => {
  render(<RunDetails trainingSession={runActivity()} />);
  const plannedMetrics = screen.getByLabelText(
    "Planned training session metrics",
  );

  expect(within(plannedMetrics).queryByText("AM")).toBeNull();
  expect(screen.queryByRole("heading", { name: "Details" })).toBeNull();
  expect(
    screen.queryByRole("heading", { name: "Recorded metrics" }),
  ).toBeNull();
  expect(screen.getByText("6.00 km")).toBeDefined();
  expect(screen.getByText("25m 30s")).toBeDefined();
  expect(screen.getByText("4:15 / km")).toBeDefined();
  expect(screen.queryByText("Target type")).toBeNull();
  expect(screen.queryByText("5.9 km")).toBeNull();
  expect(screen.queryByText("25m")).toBeNull();
});

test("renders run targets as spacious responsive metric groups", () => {
  render(<RunDetails trainingSession={runActivity()} />);
  const plannedMetrics = screen.getByLabelText(
    "Planned training session metrics",
  );
  expect(plannedMetrics.classList.contains("sm:grid-cols-3")).toBe(true);
  expect(plannedMetrics.classList.contains("gap-8")).toBe(true);
  expect(
    [...plannedMetrics.querySelectorAll("dt")].map((term) => term.textContent),
  ).toEqual(["Distance", "Target pace", "Duration"]);

  const removedCardClasses = [
    "rounded-lg",
    "border",
    "border-zinc-200",
    "bg-zinc-50",
    "p-3",
  ];

  for (const label of ["Distance", "Target pace", "Duration"]) {
    const term = within(plannedMetrics).getByText(label);
    const card = term.closest("div");
    const value = card?.querySelector("dd");

    for (const className of removedCardClasses) {
      expect(card?.classList.contains(className)).toBe(false);
    }
    expect(card?.classList.contains("col-span-2")).toBe(false);
    expect(value?.classList.contains("text-lg")).toBe(true);
    expect(value?.classList.contains("text-3xl")).toBe(false);
  }
});

test("prioritizes completed run actuals and shows their targets as supporting text", () => {
  render(
    <RunDetails
      trainingSession={runActivity({
        status: "COMPLETED",
        actualDurationSeconds: 1500,
      })}
    />,
  );

  const completedMetrics = screen.getByLabelText(
    "Completed training session metrics",
  );

  expect(
    screen.queryByLabelText("Planned training session metrics"),
  ).toBeNull();
  expect(completedMetrics.classList.contains("gap-8")).toBe(true);
  expect(
    [...completedMetrics.querySelectorAll("dt")].map(
      (term) => term.textContent,
    ),
  ).toEqual(["Actual distance", "Actual pace", "Actual duration"]);
  expect(within(completedMetrics).getByText("5.90 km")).toBeDefined();
  expect(within(completedMetrics).getByText("4:14 / km")).toBeDefined();
  expect(within(completedMetrics).getByText("25m")).toBeDefined();
  expect(within(completedMetrics).getByText("Target: 6.00 km")).toBeDefined();
  expect(within(completedMetrics).getByText("Target: 4:15 / km")).toBeDefined();
  expect(within(completedMetrics).getByText("Target: 25m 30s")).toBeDefined();

  for (const label of ["Actual distance", "Actual pace", "Actual duration"]) {
    const card = within(completedMetrics).getByText(label).closest("div");
    expect(card?.classList.contains("bg-teal-50")).toBe(false);
    expect(card?.classList.contains("border")).toBe(false);
    expect(card?.classList.contains("rounded-lg")).toBe(false);
    expect(card?.classList.contains("p-3")).toBe(false);
    expect(card?.querySelector("dd")?.classList.contains("text-2xl")).toBe(
      true,
    );
  }

  expect(
    screen.queryByRole("heading", { name: "Recorded metrics" }),
  ).toBeNull();
});

test("shows target and actual distances and paces in miles", () => {
  render(
    <DistanceDisplayProvider measurementUnit="MILES">
      <RunDetails trainingSession={runActivity({ status: "COMPLETED" })} />
    </DistanceDisplayProvider>,
  );

  const completedMetrics = screen.getByLabelText(
    "Completed training session metrics",
  );
  expect(within(completedMetrics).getByText("3.67 mi")).toBeDefined();
  expect(within(completedMetrics).getByText("Target: 3.73 mi")).toBeDefined();
  expect(within(completedMetrics).getByText("6:49 / mi")).toBeDefined();
  expect(within(completedMetrics).getByText("Target: 6:50 / mi")).toBeDefined();
});

test.each([
  {
    expectedDerivedTarget: "6:40 / km",
    expectedDuration: "40m",
    override: {
      targetDurationSeconds: 2400,
    },
  },
  {
    expectedDerivedTarget: "6:00 / km",
    expectedDuration: "30m",
    override: {
      targetDistanceMetres: 5000,
      targetDurationSeconds: 1800,
    },
  },
] satisfies Array<{
  expectedDerivedTarget: string;
  expectedDuration: string;
  override: RunOverride;
}>)(
  "derives $expectedDerivedTarget",
  ({ expectedDerivedTarget, expectedDuration, override }) => {
    render(<RunDetails trainingSession={runActivity(override)} />);
    expect(screen.getByText(expectedDuration)).toBeDefined();
    expect(screen.getByText(expectedDerivedTarget)).toBeDefined();
  },
);

test("renders derived pace and no actual metrics", () => {
  render(
    <RunDetails
      trainingSession={runActivity({
        actualDistanceMetres: null,
        actualDurationSeconds: null,
        targetDistanceMetres: 5000,
        targetDurationSeconds: 1800,
        timeOfDay: null,
      })}
    />,
  );
  const plannedMetrics = screen.getByLabelText(
    "Planned training session metrics",
  );
  expect(within(plannedMetrics).queryByText("Any time")).toBeNull();
  expect(screen.getByText("5.00 km")).toBeDefined();
  expect(screen.getByText("30m")).toBeDefined();
  expect(screen.getByText("6:00 / km")).toBeDefined();
  expect(screen.queryByText("Actual distance")).toBeNull();
  expect(screen.queryByText("Actual duration")).toBeNull();
});

test.each([
  ["distance", { actualDurationSeconds: null }, "Actual distance"],
  ["duration", { actualDistanceMetres: null }, "Actual duration"],
] satisfies Array<[string, RunOverride, string]>)(
  "omits non-completed actual %s",
  (_name, override, expectedLabel) => {
    render(<RunDetails trainingSession={runActivity(override)} />);
    expect(screen.queryByText(expectedLabel)).toBeNull();
  },
);
