import { createRunTrainingSession } from "@/test-support/fixtures/training-session";
import { render, screen } from "@testing-library/react";

const dndMocks = vi.hoisted(() => ({
  input: undefined as { accept: string } | undefined,
  isDropTarget: false,
  ref: vi.fn(),
}));

vi.mock("@dnd-kit/react", () => ({
  useDraggable: () => ({ isDragSource: false, ref: vi.fn() }),
  useDroppable: (input: { accept: string }) => {
    dndMocks.input = input;
    return dndMocks;
  },
}));

import { TimeOfDayDropZone } from "./time-of-day-drop-zone";
import type {
  PlannerTrainingSession,
  TrainingDay,
} from "../calendar/training-calendar-types";

const trainingSession = {
  ...createRunTrainingSession({
    id: "training-session",
    targetDistanceMetres: 6000,
    targetDurationSeconds: 1530,
  }),
  day: "Monday",
} satisfies PlannerTrainingSession;

const day = {
  trainingSessions: [trainingSession],
  date: "2026-08-17",
  day: "Monday",
} satisfies TrainingDay;

test("renders a highlighted dashed drop zone while a training session is over it", () => {
  dndMocks.isDropTarget = true;

  render(
    <TimeOfDayDropZone
      trainingSessions={day.trainingSessions}
      day={day}
      hasLeadingDay
      isDragActive
      label="Morning"
      onSelectTrainingSession={vi.fn()}
      timeOfDay="AM"
    />,
  );

  const zone = screen.getByRole("region", { name: "Morning" });
  expect(dndMocks.input?.accept).toBe("training-session");
  expect(zone.className).toContain("border-dashed");
  expect(zone.className).toContain("border-l");
  expect(zone.className).toContain("border-t");
  expect(zone.className).not.toContain("border-r");
  expect(zone.className).not.toContain("border-b");
  expect(zone.className).toContain("ring-inset");
  expect(zone.className).toContain("ring-teal-500");
  expect(screen.getByText("Tempo run")).toBeDefined();
});

test("does not render an empty inactive drop zone", () => {
  dndMocks.isDropTarget = false;

  render(
    <TimeOfDayDropZone
      trainingSessions={[]}
      day={{ ...day, trainingSessions: [], date: undefined }}
      hasLeadingDay={false}
      isDragActive={false}
      label="Morning"
      onSelectTrainingSession={vi.fn()}
      timeOfDay="AM"
    />,
  );

  expect(screen.queryByRole("region", { name: "Morning" })).toBeNull();
});
