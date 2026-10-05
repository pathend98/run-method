import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type {
  RunTrainingSession,
  TrainingSession,
} from "@/domain/training-sessions";
import {
  createRunTrainingSession,
  createStrengthTrainingSession,
} from "@/test-support/fixtures/training-session";
import { CompleteTrainingSessionForm } from "./complete-training-session-form";

const run = createRunTrainingSession({
  title: "Tempo",
  timeOfDay: null,
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1530,
}) satisfies RunTrainingSession;
const strength = createStrengthTrainingSession({
  title: run.title,
  timeOfDay: run.timeOfDay,
});

function renderForm(
  trainingSession: TrainingSession = run,
  onComplete = vi.fn().mockResolvedValue(undefined),
  isSubmitting = false,
) {
  const onRunFieldsPendingChange = vi.fn();
  render(
    <CompleteTrainingSessionForm
      trainingSession={trainingSession}
      isSubmitting={isSubmitting}
      onComplete={onComplete}
      onRunFieldsPendingChange={onRunFieldsPendingChange}
    />,
  );
  return { onComplete, onRunFieldsPendingChange };
}

test("prefills run actuals from targets and submits them", async () => {
  const { onComplete } = renderForm();
  expect(screen.getByLabelText("Distance (km)")).toHaveProperty("value", "6");
  expect(screen.getByLabelText("Duration (minutes)")).toHaveProperty(
    "value",
    "25",
  );
  expect(screen.getByLabelText("Pace (mm:ss / km) · Auto")).toHaveProperty(
    "value",
    "4:15",
  );
  fireEvent.submit(screen.getByLabelText("Distance (km)").closest("form")!);
  await waitFor(() =>
    expect(onComplete).toHaveBeenCalledWith({
      actualDistanceMetres: 6000,
      actualDurationSeconds: 1530,
    }),
  );
});

test("validates an invalid actual run metric after blur", async () => {
  renderForm();
  const distance = screen.getByLabelText("Distance (km)");

  fireEvent.change(distance, { target: { value: "0" } });
  fireEvent.blur(distance);

  expect(
    await screen.findByText("Distance must be greater than zero"),
  ).toBeDefined();
});

test("uses a duration-only strength form and reports failed completion", async () => {
  const onComplete = vi.fn().mockRejectedValue(new Error("nope"));
  renderForm(strength, onComplete);
  expect(screen.queryByLabelText("Distance (km)")).toBeNull();
  expect(screen.getByLabelText("Actual duration (minutes)")).toHaveProperty(
    "value",
    "45",
  );
  fireEvent.submit(
    screen.getByLabelText("Actual duration (minutes)").closest("form")!,
  );
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Unable to complete training session",
  );
});

test("disables fields while submitting", () => {
  renderForm(run, vi.fn(), true);
  expect(screen.getByLabelText("Distance (km)")).toHaveProperty(
    "disabled",
    true,
  );
});
