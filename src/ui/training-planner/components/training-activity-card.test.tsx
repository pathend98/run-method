import { fireEvent, render, screen } from "@testing-library/react";
import { TrainingActivityCard } from "./training-activity-card";
import type { TrainingActivity } from "../types/training-planner-types";

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
  updatedAt: "2026-08-01T10:00:00.000Z",
  day: "Monday",
} satisfies Partial<TrainingActivity>;

function runActivity(
  override: Partial<TrainingActivity> = {},
): TrainingActivity {
  return {
    ...baseActivity,
    activityType: "RUN",
    targetType: "DISTANCE_PACE",
    targetDistanceMetres: 6000,
    targetDurationSeconds: null,
    targetPaceSecondsPerKilometre: 255,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
    ...override,
  } as TrainingActivity;
}

test("renders the activity title, type, and description", () => {
  render(<TrainingActivityCard activity={runActivity()} />);

  expect(
    screen.getByRole("button", { name: "View Tempo run details" }),
  ).toBeDefined();
  expect(screen.getByText("Run")).toBeDefined();
  expect(screen.getByText("Controlled effort")).toBeDefined();
});

test("omits absent descriptions", () => {
  render(
    <TrainingActivityCard
      activity={runActivity({ description: null, title: "Easy run" })}
    />,
  );

  expect(
    screen.getByRole("button", { name: "View Easy run details" }),
  ).toBeDefined();
  expect(screen.queryByText("Controlled effort")).toBeNull();
});

test("calls the select handler when clicked", () => {
  const onSelect = vi.fn();

  render(<TrainingActivityCard activity={runActivity()} onSelect={onSelect} />);
  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );

  expect(onSelect).toHaveBeenCalledTimes(1);
});
