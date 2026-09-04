import { render, screen, within } from "@testing-library/react";

import type { RunTrainingSession } from "@/domain/training-sessions";
import { RunActivityDetails } from "./run-activity-details";

type RunOverride = Partial<RunTrainingSession>;

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
    targetDistanceMetres: 6000,
    targetDurationSeconds: 1530,
    actualDistanceMetres: 5900,
    actualDurationSeconds: 1500,
    ...override,
  } as RunTrainingSession;
}

test("renders scheduled run targets and actual values", () => {
  render(<RunActivityDetails activity={runActivity()} />);
  const plannedMetrics = screen.getByLabelText("Planned activity metrics");
  const details = screen
    .getByRole("heading", { level: 3, name: "Details" })
    .closest("section");

  expect(within(plannedMetrics).queryByText("AM")).toBeNull();
  expect(within(details!).getByText("Time of day")).toBeDefined();
  expect(within(details!).getByText("AM")).toBeDefined();
  expect(screen.getByText("6.0 km")).toBeDefined();
  expect(screen.getByText("00:25:30")).toBeDefined();
  expect(screen.getByText("4:15 / km")).toBeDefined();
  expect(screen.queryByText("Target type")).toBeNull();
  expect(screen.getByText("5.9 km")).toBeDefined();
  expect(screen.getByText("00:25:00")).toBeDefined();
});

test("renders run targets as spacious responsive metric groups", () => {
  render(<RunActivityDetails activity={runActivity()} />);
  const plannedMetrics = screen.getByLabelText("Planned activity metrics");
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
    <RunActivityDetails
      activity={runActivity({ status: "COMPLETED", actualDurationSeconds: 1500 })}
    />,
  );

  const completedMetrics = screen.getByLabelText("Completed activity metrics");

  expect(screen.queryByLabelText("Planned activity metrics")).toBeNull();
  expect(completedMetrics.classList.contains("gap-8")).toBe(true);
  expect(
    [...completedMetrics.querySelectorAll("dt")].map((term) => term.textContent),
  ).toEqual(["Actual distance", "Actual pace", "Actual duration"]);
  expect(within(completedMetrics).getByText("5.9 km")).toBeDefined();
  expect(within(completedMetrics).getByText("4:14 / km")).toBeDefined();
  expect(within(completedMetrics).getByText("00:25:00")).toBeDefined();
  expect(within(completedMetrics).getByText("Target: 6.0 km")).toBeDefined();
  expect(within(completedMetrics).getByText("Target: 4:15 / km")).toBeDefined();
  expect(
    within(completedMetrics).getByText("Target: 00:25:30"),
  ).toBeDefined();

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

  const details = screen
    .getByRole("heading", { level: 3, name: "Details" })
    .closest("section");
  expect(within(details!).queryByText("Actual distance")).toBeNull();
  expect(within(details!).queryByText("Actual duration")).toBeNull();
});

test.each([
  {
    expectedDerivedTarget: "6:40 / km",
    expectedDuration: "00:40:00",
    override: {
      targetDurationSeconds: 2400,
    },
  },
  {
    expectedDerivedTarget: "6:00 / km",
    expectedDuration: "00:30:00",
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
    render(<RunActivityDetails activity={runActivity(override)} />);
    expect(screen.getByText(expectedDuration)).toBeDefined();
    expect(screen.getByText(expectedDerivedTarget)).toBeDefined();
  },
);

test("renders derived pace and no actual metrics", () => {
  render(
    <RunActivityDetails
      activity={runActivity({
        actualDistanceMetres: null,
        actualDurationSeconds: null,
        targetDistanceMetres: 5000,
        targetDurationSeconds: 1800,
        timeOfDay: null,
      })}
    />,
  );
  const plannedMetrics = screen.getByLabelText("Planned activity metrics");
  expect(within(plannedMetrics).queryByText("Any time")).toBeNull();
  expect(screen.getByText("Any time")).toBeDefined();
  expect(screen.getByText("5.0 km")).toBeDefined();
  expect(screen.getByText("00:30:00")).toBeDefined();
  expect(screen.getByText("6:00 / km")).toBeDefined();
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
