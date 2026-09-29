import { createRunActivity } from "@/test-support/fixtures/activity";
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
  ...createRunActivity({
    id: "activity",
    targetDistanceMetres: 6000,
    targetDurationSeconds: 1530,
  }),
  day: "Monday",
} satisfies TrainingActivity;

test("fades the source card while it is being dragged", () => {
  dndMocks.isDragSource = true;

  render(<DraggableActivityCard activity={activity} onSelect={vi.fn()} />);

  expect(
    screen.getByRole("button", { name: "View Tempo run details" }).parentElement
      ?.className,
  ).toContain("opacity-40");
});

test("shows a grab cursor on an inactive scheduled activity button", () => {
  dndMocks.isDragSource = false;

  render(<DraggableActivityCard activity={activity} onSelect={vi.fn()} />);

  expect(
    screen.getByRole("button", { name: "View Tempo run details" }).className,
  ).toContain("!cursor-grab");
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
    expect(
      screen.getByRole("button", { name: "View Tempo run details" }).className,
    ).not.toContain("cursor-grab");

    fireEvent.click(
      screen.getByRole("button", { name: "View Tempo run details" }),
    );
    expect(onSelect).toHaveBeenCalledOnce();
  },
);
