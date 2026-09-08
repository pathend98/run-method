import { render, screen } from "@testing-library/react";

const dndMocks = vi.hoisted(() => ({
  isDropTarget: false,
  ref: vi.fn(),
}));

vi.mock("@dnd-kit/react", () => ({
  useDraggable: () => ({ isDragSource: false, ref: vi.fn() }),
  useDroppable: () => dndMocks,
}));

import { TimeOfDayDropZone } from "./time-of-day-drop-zone";
import type {
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";

const activity = {
  activityType: "RUN",
  actualDistanceMetres: null,
  actualDurationSeconds: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  date: "2026-08-17",
  day: "Monday",
  description: null,
  id: "activity",
  skipReason: null,
  sortOrder: 0,
  status: "SCHEDULED",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1530,
  timeOfDay: "AM",
  title: "Tempo run",
  updatedAt: "2026-08-01T10:00:00.000Z",
} satisfies TrainingActivity;

const day = {
  activities: [activity],
  date: "2026-08-17",
  day: "Monday",
} satisfies TrainingDay;

test("renders a highlighted dashed drop zone while an activity is over it", () => {
  dndMocks.isDropTarget = true;

  render(
    <TimeOfDayDropZone
      activities={day.activities}
      day={day}
      isDragActive
      label="Morning"
      onSelectActivity={vi.fn()}
      timeOfDay="AM"
    />,
  );

  const zone = screen.getByRole("region", { name: "Morning" });
  expect(zone.className).toContain("border-dashed");
  expect(zone.className).toContain("border-teal-500");
  expect(screen.getByText("Tempo run")).toBeDefined();
});

test("does not render an empty inactive drop zone", () => {
  dndMocks.isDropTarget = false;

  render(
    <TimeOfDayDropZone
      activities={[]}
      day={{ ...day, activities: [], date: undefined }}
      isDragActive={false}
      label="Morning"
      onSelectActivity={vi.fn()}
      timeOfDay="AM"
    />,
  );

  expect(screen.queryByRole("region", { name: "Morning" })).toBeNull();
});
