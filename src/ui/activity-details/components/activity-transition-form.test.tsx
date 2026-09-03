import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import { ActivityTransitionForm } from "./activity-transition-form";

const runActivity = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Tempo run",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: "Controlled effort",
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  activityType: "RUN",
  targetType: "DISTANCE_DURATION",
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1800,
  targetPaceSecondsPerKilometre: null,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
} satisfies RunTrainingSession;

const strengthActivity = {
  ...runActivity,
  id: "22222222-2222-4222-8222-222222222222",
  activityType: "STRENGTH",
  targetDurationSeconds: 2700,
} satisfies StrengthTrainingSession;

function renderForm({
  activity = runActivity,
  isSubmitting = false,
  mode = "complete" as const,
  onComplete = vi.fn().mockResolvedValue(undefined),
  onSkip = vi.fn().mockResolvedValue(undefined),
}: Partial<React.ComponentProps<typeof ActivityTransitionForm>> = {}) {
  const rendered = render(
    <ActivityTransitionForm
      activity={activity}
      isSubmitting={isSubmitting}
      mode={mode}
      onComplete={onComplete}
      onSkip={onSkip}
    />,
  );

  return { ...rendered, onComplete, onSkip };
}

test("renders the fields required for each transition", () => {
  const { rerender } = render(
    <ActivityTransitionForm
      activity={runActivity}
      isSubmitting={false}
      mode="complete"
      onComplete={vi.fn()}
      onSkip={vi.fn()}
    />,
  );

  expect(screen.getByLabelText("Duration (minutes)")).toBeDefined();
  expect(screen.getByLabelText("Distance (km)")).toBeDefined();
  expect(screen.getByLabelText("Pace (mm:ss / km)")).toBeDefined();

  rerender(
    <ActivityTransitionForm
      activity={strengthActivity}
      isSubmitting={false}
      mode="complete"
      onComplete={vi.fn()}
      onSkip={vi.fn()}
    />,
  );
  expect(screen.queryByLabelText("Distance (km)")).toBeNull();

  rerender(
    <ActivityTransitionForm
      activity={runActivity}
      isSubmitting={false}
      mode="skip"
      onComplete={vi.fn()}
      onSkip={vi.fn()}
    />,
  );
  expect(screen.getByLabelText("Skip reason")).toBeDefined();
});

test("shows validation errors without submitting", async () => {
  const { onComplete } = renderForm();
  fireEvent.submit(
    screen.getByLabelText("Duration (minutes)").closest("form")!,
  );

  expect(await screen.findByText("Duration must be greater than zero")).toBeDefined();
  expect(screen.getByText("Enter a distance in kilometres")).toBeDefined();
  expect(onComplete).not.toHaveBeenCalled();
});

test("submits a converted skip request", async () => {
  const { onSkip } = renderForm({ mode: "skip" });
  fireEvent.change(screen.getByLabelText("Skip reason"), {
    target: { value: "  Recovery  " },
  });
  fireEvent.submit(screen.getByLabelText("Skip reason").closest("form")!);

  await waitFor(() =>
    expect(onSkip).toHaveBeenCalledWith({ skipReason: "Recovery" }),
  );
});

test("submits converted run and strength completion requests", async () => {
  const run = renderForm();
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "42" },
  });
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "6.2" },
  });
  expect(screen.getByLabelText("Pace (mm:ss / km) · Auto")).toHaveProperty(
    "value",
    "6:46",
  );
  fireEvent.submit(
    screen.getByLabelText("Duration (minutes)").closest("form")!,
  );
  await waitFor(() =>
    expect(run.onComplete).toHaveBeenCalledWith({
      actualDistanceMetres: 6200,
      actualDurationSeconds: 2520,
    }),
  );
  run.unmount();

  const strength = vi.fn().mockResolvedValue(undefined);
  renderForm({ activity: strengthActivity, onComplete: strength });
  fireEvent.change(screen.getByLabelText("Actual duration (minutes)"), {
    target: { value: "30" },
  });
  fireEvent.submit(
    screen.getByLabelText("Actual duration (minutes)").closest("form")!,
  );
  await waitFor(() =>
    expect(strength).toHaveBeenCalledWith({ actualDurationSeconds: 1800 }),
  );
});

test("reports a rejected submission", async () => {
  const { onComplete } = renderForm({
    onComplete: vi.fn().mockRejectedValue(new Error("nope")),
  });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "30" },
  });
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "5" },
  });
  fireEvent.submit(
    screen.getByLabelText("Duration (minutes)").closest("form")!,
  );

  expect((await screen.findByRole("alert")).textContent).toContain(
    "Unable to complete activity",
  );
  expect(onComplete).toHaveBeenCalledOnce();
});

test("disables transition inputs while submitting", () => {
  renderForm({ isSubmitting: true });

  expect(screen.getByLabelText("Duration (minutes)")).toHaveProperty(
    "disabled",
    true,
  );
  expect(screen.getByLabelText("Distance (km)")).toHaveProperty(
    "disabled",
    true,
  );
  expect(screen.getByLabelText("Pace (mm:ss / km)")).toHaveProperty(
    "disabled",
    true,
  );
});
