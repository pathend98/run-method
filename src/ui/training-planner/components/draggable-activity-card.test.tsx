import { fireEvent, render, screen } from "@testing-library/react";

const dndMocks = vi.hoisted(() => ({
  input: undefined as { disabled: boolean } | undefined,
  isDragSource: false,
  ref: vi.fn(),
}));

vi.mock("@dnd-kit/react", () => ({
  useDraggable: (input: { disabled: boolean }) => {
    dndMocks.input = input;
    return dndMocks;
  },
}));

import { DraggableActivityCard } from "./draggable-activity-card";
import type { TrainingActivity } from "../types/training-planner-types";

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

test("fades the source card while it is being dragged", () => {
  dndMocks.isDragSource = true;

  render(<DraggableActivityCard activity={activity} onSelect={vi.fn()} />);

  expect(
    screen.getByRole("button", { name: "View Tempo run details" }).parentElement
      ?.className,
  ).toContain("opacity-40");
});

test("keeps an inactive card fully opaque", () => {
  dndMocks.isDragSource = false;

  render(<DraggableActivityCard activity={activity} onSelect={vi.fn()} />);

  expect(
    screen.getByRole("button", { name: "View Tempo run details" }).parentElement
      ?.className,
  ).toBe("");
});

test("enables dragging for scheduled activities", () => {
  render(<DraggableActivityCard activity={activity} onSelect={vi.fn()} />);

  expect(dndMocks.input?.disabled).toBe(false);
});

test.each(["COMPLETED", "SKIPPED"] as const)(
  "disables dragging for %s activities while retaining detail selection",
  (status) => {
    const onSelect = vi.fn();

    render(
      <DraggableActivityCard
        activity={{ ...activity, status }}
        onSelect={onSelect}
      />,
    );

    expect(dndMocks.input?.disabled).toBe(true);

    fireEvent.click(
      screen.getByRole("button", { name: "View Tempo run details" }),
    );
    expect(onSelect).toHaveBeenCalledOnce();
  },
);
