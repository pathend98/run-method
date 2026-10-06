import { render, screen } from "@testing-library/react";

import type { TrainingSession } from "@/domain/training-sessions";
import { createRunTrainingSession } from "@/test-support/fixtures/training-session";
import { WeeklySummary } from "./weekly-summary";
import { DistanceDisplayProvider } from "@/ui/users/measurement-unit-context";

const trainingSession: TrainingSession = createRunTrainingSession({
  date: "2026-08-22",
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1800,
  timeOfDay: null,
  title: "Long run",
});

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test("renders current-week completed and training session status lines", () => {
  vi.setSystemTime(new Date(2026, 7, 20, 12));
  render(
    <WeeklySummary
      trainingSessions={[trainingSession]}
      className="mb-8"
      weekRange={{ from: "2026-08-17", to: "2026-08-23" }}
    />,
  );

  const completedDistance = screen.getByText("0.00 km");
  expect(completedDistance.classList.contains("text-2xl")).toBe(true);
  expect(completedDistance.classList.contains("font-semibold")).toBe(true);
  expect(screen.getByText("5.00 km scheduled")).toBeDefined();
  expect(screen.getByText("0m")).toBeDefined();
  const completedTrainingSessions = screen.getByText("0 completed");
  expect(completedTrainingSessions.classList).toContain("text-sm");
  expect(completedTrainingSessions.classList).toContain("sm:text-2xl");
  expect(completedTrainingSessions.classList).toContain("sm:font-semibold");
  expect(screen.getByText("1 upcoming")).toBeDefined();
  expect(screen.queryByText(/due/)).toBeNull();
  expect(screen.queryByText(/skipped/)).toBeNull();
  expect(screen.getAllByRole("progressbar")).toHaveLength(2);
  const summary = screen.getByRole("region", { name: "Weekly summary" });
  expect(summary.classList).toContain("grid-cols-2");
  expect(summary.classList).toContain("sm:grid-cols-3");
  expect(summary.classList).toContain("mb-8");
  const trainingSessions = screen.getByRole("heading", {
    level: 2,
    name: "Training sessions",
  }).parentElement;
  expect(trainingSessions?.classList).toContain("col-span-2");
  expect(trainingSessions?.classList).toContain("sm:col-span-1");
  expect(screen.getByText("·").classList).toContain("sm:hidden");
});

test("calculates distance and duration progress from completed actuals", () => {
  vi.setSystemTime(new Date(2026, 7, 20, 12));
  const completedTrainingSession: TrainingSession = {
    ...trainingSession,
    actualDistanceMetres: 2500,
    actualDurationSeconds: 900,
    date: "2026-08-20",
    status: "COMPLETED",
  };
  render(
    <WeeklySummary
      trainingSessions={[completedTrainingSession]}
      weekRange={{ from: "2026-08-17", to: "2026-08-23" }}
    />,
  );

  expect(
    screen
      .getByRole("progressbar", { name: "Running distance progress" })
      .getAttribute("aria-valuenow"),
  ).toBe("50");
  expect(
    screen
      .getByRole("progressbar", { name: "Training time progress" })
      .getAttribute("aria-valuenow"),
  ).toBe("50");
  expect(screen.queryByText(/skipped|due|upcoming/)).toBeNull();
});

test("includes skipped training sessions when present", () => {
  vi.setSystemTime(new Date(2026, 7, 20, 12));
  const skippedTrainingSession: TrainingSession = {
    ...trainingSession,
    skipReason: "Rest day",
    status: "SKIPPED",
  };
  render(
    <WeeklySummary
      trainingSessions={[skippedTrainingSession]}
      weekRange={{ from: "2026-08-17", to: "2026-08-23" }}
    />,
  );

  expect(screen.getByText("1 skipped")).toBeDefined();
  expect(screen.queryByText(/due/)).toBeNull();
});

test("shows planned totals and variance for a past week", () => {
  vi.setSystemTime(new Date(2026, 7, 24, 12));
  const pastTrainingSession: TrainingSession = {
    ...trainingSession,
    actualDistanceMetres: 86700,
    actualDurationSeconds: 23820,
    date: "2026-08-17",
    status: "COMPLETED",
    targetDistanceMetres: 85600,
    targetDurationSeconds: 24660,
  };
  render(
    <WeeklySummary
      trainingSessions={[pastTrainingSession]}
      weekRange={{ from: "2026-08-17", to: "2026-08-23" }}
    />,
  );

  expect(screen.getByText("86.70 km")).toBeDefined();
  expect(screen.getByText("85.60 km planned · +1.1 km")).toBeDefined();
  expect(screen.getByText("6h 37m")).toBeDefined();
  expect(screen.getByText("6h 51m planned · −14 min")).toBeDefined();
  expect(
    screen
      .getByRole("progressbar", { name: "Running distance progress" })
      .getAttribute("aria-valuenow"),
  ).toBe("100");
});

test("shows past-week totals and variance in miles", () => {
  vi.setSystemTime(new Date(2026, 7, 24, 12));
  render(
    <DistanceDisplayProvider measurementUnit="MILES">
      <WeeklySummary
        trainingSessions={[
          {
            ...trainingSession,
            actualDistanceMetres: 9656,
            actualDurationSeconds: 1800,
            date: "2026-08-17",
            status: "COMPLETED",
            targetDistanceMetres: 8047,
          },
        ]}
        weekRange={{ from: "2026-08-17", to: "2026-08-23" }}
      />
    </DistanceDisplayProvider>,
  );

  expect(screen.getByText("6.00 mi")).toBeDefined();
  expect(screen.getByText("5.00 mi planned · +1.0 mi")).toBeDefined();
});

test("includes due training sessions when present", () => {
  vi.setSystemTime(new Date(2026, 7, 20, 12));
  render(
    <WeeklySummary
      trainingSessions={[{ ...trainingSession, date: "2026-08-20" }]}
      weekRange={{ from: "2026-08-17", to: "2026-08-23" }}
    />,
  );

  expect(screen.getByText("1 due")).toBeDefined();
});

test("renders only scheduled values for a future week", () => {
  vi.setSystemTime(new Date(2026, 7, 16, 12));
  render(
    <WeeklySummary
      trainingSessions={[trainingSession]}
      weekRange={{ from: "2026-08-17", to: "2026-08-23" }}
    />,
  );

  expect(screen.queryByText("0.0 km")).toBeNull();
  const scheduledTrainingSessions = screen.getByText("1 scheduled");
  expect(scheduledTrainingSessions.classList).toContain("text-sm");
  expect(scheduledTrainingSessions.classList).toContain("sm:text-2xl");
  expect(scheduledTrainingSessions.classList).toContain("sm:font-semibold");
  expect(
    screen
      .getByRole("progressbar", { name: "Running distance progress" })
      .getAttribute("aria-valuenow"),
  ).toBe("0");
  expect(
    screen
      .getByRole("progressbar", { name: "Training time progress" })
      .getAttribute("aria-valuenow"),
  ).toBe("0");
});
