import { createRunTrainingSession } from "@/test-support/fixtures/training-session";
import { fireEvent, render, screen } from "@testing-library/react";

const dndMocks = vi.hoisted(() => ({
  input: undefined as
    | {
        disabled: boolean;
        data: { trainingSession: TrainingSession };
        type: string;
        id: string;
      }
    | undefined,
  isDragSource: false,
  ref: vi.fn(),
}));

vi.mock("@dnd-kit/react", () => ({
  useDraggable: (input: {
    disabled: boolean;
    data: { trainingSession: TrainingSession };
    type: string;
    id: string;
  }) => {
    dndMocks.input = input;
    return dndMocks;
  },
}));

import { DraggableTrainingSessionCard } from "./draggable-training-session-card";
import type { TrainingSession } from "@/domain/training-sessions";

const trainingSession = {
  ...createRunTrainingSession({
    id: "training-session",
    targetDistanceMetres: 6000,
    targetDurationSeconds: 1530,
  }),
} satisfies TrainingSession;

test("fades the source card while it is being dragged", () => {
  dndMocks.isDragSource = true;

  render(
    <DraggableTrainingSessionCard
      trainingSession={trainingSession}
      onSelect={vi.fn()}
    />,
  );

  expect(
    screen.getByRole("button", { name: "View Tempo run details" }).parentElement
      ?.className,
  ).toContain("opacity-40");
});

test("shows a grab cursor on an inactive scheduled training session button", () => {
  dndMocks.isDragSource = false;

  render(
    <DraggableTrainingSessionCard
      trainingSession={trainingSession}
      onSelect={vi.fn()}
    />,
  );

  expect(
    screen.getByRole("button", { name: "View Tempo run details" }).className,
  ).toContain("!cursor-grab");
});

test("enables dragging for scheduled training sessions", () => {
  render(
    <DraggableTrainingSessionCard
      trainingSession={trainingSession}
      onSelect={vi.fn()}
    />,
  );

  expect(dndMocks.input).toMatchObject({
    disabled: false,
    data: { trainingSession },
    type: "training-session",
    id: trainingSession.id,
  });
});

test.each(["COMPLETED", "SKIPPED"] as const)(
  "disables dragging for %s training sessions while retaining detail selection",
  (status) => {
    const onSelect = vi.fn();

    render(
      <DraggableTrainingSessionCard
        trainingSession={{ ...trainingSession, status }}
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
