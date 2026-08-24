import { fireEvent, render, screen, within } from "@testing-library/react";
import { TimeOfDaySection } from "./time-of-day-section";
import type { TrainingActivity } from "../types/training-planner-types";

const baseActivity = {
  id: "activity",
  title: "Tempo run",
  activityType: "RUN",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: "Controlled effort",
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  targetType: "DISTANCE_PACE",
  targetDistanceMetres: 6000,
  targetDurationSeconds: null,
  targetPaceSecondsPerKilometre: 255,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
  day: "Monday",
} satisfies TrainingActivity;

function activity(override: Partial<TrainingActivity> = {}): TrainingActivity {
  return { ...baseActivity, ...override } as TrainingActivity;
}

test("renders a labelled time section with activity cards", () => {
  render(
    <TimeOfDaySection
      activities={[
        activity({ id: "tempo", title: "Tempo run" }),
        activity({ id: "strides", title: "Strides" }),
      ]}
      day="Monday"
      label="Any time"
      onSelectActivity={vi.fn()}
    />,
  );

  const heading = screen.getByRole("heading", {
    level: 3,
    name: "Any time",
  });
  expect(heading.id).toBe("monday-any-time");

  const section = heading.closest("section");
  expect(section).not.toBeNull();
  expect(
    within(section as HTMLElement).getByRole("button", {
      name: "View Tempo run details",
    }),
  ).toBeDefined();
  expect(
    within(section as HTMLElement).getByRole("button", {
      name: "View Strides details",
    }),
  ).toBeDefined();
});

test("passes the selected activity to the select handler", () => {
  const onSelectActivity = vi.fn();
  const selectedActivity = activity({ id: "tempo", title: "Tempo run" });

  render(
    <TimeOfDaySection
      activities={[selectedActivity]}
      day="Monday"
      label="AM"
      onSelectActivity={onSelectActivity}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );

  expect(onSelectActivity).toHaveBeenCalledWith(selectedActivity);
});
