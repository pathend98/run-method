import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import { EditActivityForm } from "./edit-activity-form";

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
  targetType: "DISTANCE_PACE",
  targetDistanceMetres: 6000,
  targetDurationSeconds: null,
  targetPaceSecondsPerKilometre: 255,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
} satisfies RunTrainingSession;

const strengthActivity = {
  ...runActivity,
  id: "22222222-2222-4222-8222-222222222222",
  title: "Strength",
  activityType: "STRENGTH",
  targetDurationSeconds: 2700,
  actualDurationSeconds: null,
} satisfies StrengthTrainingSession;

test("renders pre-populated editable fields for a scheduled run", () => {
  render(
    <EditActivityForm
      activity={runActivity}
      onClose={vi.fn()}
      onEdit={vi.fn()}
    />,
  );

  expect(screen.getByLabelText("Title")).toHaveProperty("value", "Tempo run");
  expect(screen.getByLabelText("Time of day")).toHaveProperty("value", "AM");
  expect(screen.getByLabelText("Distance (km)")).toHaveProperty("value", "6");
  expect(screen.getByLabelText("Pace (mm:ss / km)")).toHaveProperty(
    "value",
    "4:15",
  );
});

test("submits an edit and closes the form", async () => {
  const onClose = vi.fn();
  const onEdit = vi.fn().mockResolvedValue(undefined);
  render(
    <EditActivityForm
      activity={runActivity}
      onClose={onClose}
      onEdit={onEdit}
    />,
  );
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Updated tempo" },
  });
  fireEvent.change(screen.getByLabelText("Time of day"), {
    target: { value: "PM" },
  });
  fireEvent.submit(screen.getByLabelText("Title").closest("form")!);

  await waitFor(() => expect(onEdit).toHaveBeenCalledOnce());
  expect(onEdit).toHaveBeenCalledWith(
    expect.objectContaining({
      activityType: "RUN",
      targetType: "DISTANCE_PACE",
      title: "Updated tempo",
      timeOfDay: "PM",
    }),
  );
  expect(onClose).toHaveBeenCalledOnce();
});

test("keeps the form open and reports a failed edit", async () => {
  const onClose = vi.fn();
  render(
    <EditActivityForm
      activity={runActivity}
      onClose={onClose}
      onEdit={vi.fn().mockRejectedValue(new Error("nope"))}
    />,
  );
  fireEvent.submit(screen.getByLabelText("Title").closest("form")!);

  expect((await screen.findByRole("alert")).textContent).toContain(
    "Unable to edit activity",
  );
  expect(onClose).not.toHaveBeenCalled();
});

test("shows validation errors without submitting", async () => {
  const onEdit = vi.fn();
  render(
    <EditActivityForm
      activity={runActivity}
      onClose={vi.fn()}
      onEdit={onEdit}
    />,
  );
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "" } });
  fireEvent.submit(screen.getByLabelText("Title").closest("form")!);

  expect(await screen.findByText("Enter an activity title")).toBeDefined();
  expect(onEdit).not.toHaveBeenCalled();
});

test("hides locked terminal run fields", () => {
  render(
    <EditActivityForm
      activity={{ ...runActivity, status: "COMPLETED" }}
      onClose={vi.fn()}
      onEdit={vi.fn()}
    />,
  );

  expect(screen.queryByLabelText("Time of day")).toBeNull();
  expect(screen.queryByLabelText("Distance (km)")).toBeNull();
  expect(screen.queryByLabelText("Pace (mm:ss / km)")).toBeNull();
});

test("renders an editable duration for scheduled strength activities", () => {
  render(
    <EditActivityForm
      activity={strengthActivity}
      onClose={vi.fn()}
      onEdit={vi.fn()}
    />,
  );

  expect(screen.getByLabelText("Time of day")).toBeDefined();
  expect(screen.getByLabelText("Duration (minutes, optional)")).toHaveProperty(
    "value",
    "45",
  );
  expect(screen.queryByLabelText("Distance (km)")).toBeNull();
});

test("hides the duration for terminal strength activities", () => {
  render(
    <EditActivityForm
      activity={{ ...strengthActivity, status: "COMPLETED" }}
      onClose={vi.fn()}
      onEdit={vi.fn()}
    />,
  );

  expect(screen.queryByLabelText("Duration (minutes, optional)")).toBeNull();
});
