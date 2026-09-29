import { createRunActivity } from "@/test-support/fixtures/activity";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { TimeOfDaySection } from "./time-of-day-section";
import type { TrainingActivity } from "../types/training-planner-types";

const baseActivity = {
  ...createRunActivity({
    id: "activity",
    description: "Controlled effort",
    targetDistanceMetres: 6000,
    targetDurationSeconds: 1530,
  }),
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
