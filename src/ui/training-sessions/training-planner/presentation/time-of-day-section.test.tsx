import { createRunTrainingSession } from "@/test-support/fixtures/training-session";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { TimeOfDaySection } from "./time-of-day-section";
import type { PlannerTrainingSession } from "../calendar/training-calendar-types";

const baseTrainingSession = {
  ...createRunTrainingSession({
    id: "training-session",
    description: "Controlled effort",
    targetDistanceMetres: 6000,
    targetDurationSeconds: 1530,
  }),
  day: "Monday",
} satisfies PlannerTrainingSession;

function trainingSession(
  override: Partial<PlannerTrainingSession> = {},
): PlannerTrainingSession {
  return { ...baseTrainingSession, ...override } as PlannerTrainingSession;
}

test("renders a labelled time section with training session cards", () => {
  render(
    <TimeOfDaySection
      trainingSessions={[
        trainingSession({ id: "tempo", title: "Tempo run" }),
        trainingSession({ id: "strides", title: "Strides" }),
      ]}
      day="Monday"
      label="Any time"
      onSelectTrainingSession={vi.fn()}
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

test("passes the selected training session to the select handler", () => {
  const onSelectTrainingSession = vi.fn();
  const selectedTrainingSession = trainingSession({
    id: "tempo",
    title: "Tempo run",
  });

  render(
    <TimeOfDaySection
      trainingSessions={[selectedTrainingSession]}
      day="Monday"
      label="AM"
      onSelectTrainingSession={onSelectTrainingSession}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );

  expect(onSelectTrainingSession).toHaveBeenCalledWith(selectedTrainingSession);
});
