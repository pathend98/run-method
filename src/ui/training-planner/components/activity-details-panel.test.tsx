import { fireEvent, render, screen, within } from "@testing-library/react";
import { ActivityDetailsPanel } from "./activity-details-panel";
import type { TrainingActivity } from "../types/training-planner-types";

type RunTrainingActivity = Extract<
  TrainingActivity,
  { activityType: "RUN" }
>;
type StrengthTrainingActivity = Extract<
  TrainingActivity,
  { activityType: "STRENGTH" }
>;
type RunTrainingActivityOverride = Omit<
  Partial<RunTrainingActivity>,
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

const baseActivity = {
  id: "activity",
  title: "Tempo run",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: "Controlled effort",
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T11:30:00.000Z",
  day: "Monday",
} satisfies Partial<TrainingActivity>;

function runActivity(
  override: RunTrainingActivityOverride = {},
): TrainingActivity {
  return {
    ...baseActivity,
    activityType: "RUN",
    targetType: "DISTANCE_PACE",
    targetDistanceMetres: 6000,
    targetDurationSeconds: null,
    targetPaceSecondsPerKilometre: 255,
    actualDistanceMetres: 5900,
    actualDurationSeconds: 1500,
    ...override,
  } as TrainingActivity;
}

function strengthActivity(
  override: Partial<StrengthTrainingActivity> = {},
): TrainingActivity {
  return {
    ...baseActivity,
    id: "strength",
    title: "Strength",
    activityType: "STRENGTH",
    timeOfDay: "PM",
    targetDurationSeconds: 2700,
    actualDurationSeconds: 2400,
    ...override,
  } as TrainingActivity;
}

test("renders an empty details state when no activity is selected", () => {
  render(<ActivityDetailsPanel activity={null} onClose={vi.fn()} />);

  expect(
    screen.getByRole("complementary", { name: "Activity details" }),
  ).toBeDefined();
  expect(
    screen.getByText("Select an activity to view its full details."),
  ).toBeDefined();
});

test("calls the close handler from the close button", () => {
  const onClose = vi.fn();

  render(<ActivityDetailsPanel activity={runActivity()} onClose={onClose} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Close activity details" }),
  );

  expect(onClose).toHaveBeenCalledTimes(1);
});

test("renders full run activity details with formatted values", () => {
  render(<ActivityDetailsPanel activity={runActivity()} onClose={vi.fn()} />);

  const panel = screen.getByRole("complementary", {
    name: "Activity details",
  });
  expect(
    within(panel).getByRole("heading", { level: 2, name: "Tempo run" }),
  ).toBeDefined();
  expect(within(panel).getByText("Run")).toBeDefined();
  expect(within(panel).getByText("activity")).toBeDefined();
  expect(within(panel).getByText("Monday")).toBeDefined();
  expect(within(panel).getByText("2026-08-17")).toBeDefined();
  expect(within(panel).getByText("AM")).toBeDefined();
  expect(within(panel).getByText("Scheduled")).toBeDefined();
  expect(within(panel).getByText("Controlled effort")).toBeDefined();
  expect(within(panel).getByText("0")).toBeDefined();
  expect(within(panel).getByText("1 Aug 2026, 10:00")).toBeDefined();
  expect(within(panel).getByText("1 Aug 2026, 11:30")).toBeDefined();
  expect(within(panel).getByText("Distance + Pace")).toBeDefined();
  expect(within(panel).getByText("6.0 km")).toBeDefined();
  expect(within(panel).getByText("4:15 / km")).toBeDefined();
  expect(within(panel).getByText("5.9 km")).toBeDefined();
  expect(within(panel).getByText("25 min")).toBeDefined();
});

test("renders strength details with duration values", () => {
  render(
    <ActivityDetailsPanel activity={strengthActivity()} onClose={vi.fn()} />,
  );

  const panel = screen.getByRole("complementary", {
    name: "Activity details",
  });
  expect(
    within(panel).getByRole("heading", { level: 2, name: "Strength" }),
  ).toBeDefined();
  expect(within(panel).getAllByText("Strength")).toHaveLength(2);
  expect(within(panel).getByText("45 min")).toBeDefined();
  expect(within(panel).getByText("40 min")).toBeDefined();
});

test("renders null metrics and optional fields as empty values", () => {
  render(
    <ActivityDetailsPanel
      activity={runActivity({
        description: null,
        targetDistanceMetres: null,
        targetDurationSeconds: null,
        targetPaceSecondsPerKilometre: null,
        actualDistanceMetres: null,
        actualDurationSeconds: null,
        targetType: "DURATION_PACE",
        timeOfDay: null,
      })}
      onClose={vi.fn()}
    />,
  );

  const panel = screen.getByRole("complementary", {
    name: "Activity details",
  });
  expect(within(panel).getByText("Any time")).toBeDefined();
  expect(within(panel).getAllByText("None")).toHaveLength(6);
});

test("renders skipped activity metadata", () => {
  render(
    <ActivityDetailsPanel
      activity={strengthActivity({
        status: "SKIPPED",
        description: null,
        skipReason: "Travel day",
      })}
      onClose={vi.fn()}
    />,
  );

  const panel = screen.getByRole("complementary", {
    name: "Activity details",
  });
  expect(within(panel).getByText("Skipped")).toBeDefined();
  expect(within(panel).getByText("Travel day")).toBeDefined();
});
