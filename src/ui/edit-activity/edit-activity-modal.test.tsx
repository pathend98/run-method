import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import { EditActivityModal } from "./edit-activity-modal";

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

test("renders pre-populated editable fields and read-only discriminators", () => {
  render(
    <EditActivityModal
      activity={runActivity}
      isSubmitting={false}
      onClose={vi.fn()}
      onEdit={vi.fn()}
    />,
  );
  const dialog = screen.getByRole("dialog", { name: "Edit activity" });
  expect(screen.getByLabelText("Title")).toHaveProperty("value", "Tempo run");
  expect(screen.getByLabelText("Time of day")).toHaveProperty("value", "AM");
  expect(screen.getByLabelText("Distance (km)")).toHaveProperty("value", "6");
  expect(screen.getByLabelText("Pace (mm:ss / km)")).toHaveProperty(
    "value",
    "4:15",
  );
  expect(within(dialog).getAllByText("Run").length).toBeGreaterThan(0);
  expect(within(dialog).getByText("Distance + Pace")).toBeDefined();
  expect(screen.queryByLabelText("Activity type")).toBeNull();
  expect(screen.queryByLabelText("Run target")).toBeNull();
});

test("submits an edit and returns to details through onClose", async () => {
  const onClose = vi.fn();
  const onEdit = vi.fn().mockResolvedValue(undefined);
  render(
    <EditActivityModal
      activity={runActivity}
      isSubmitting={false}
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
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

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
    <EditActivityModal
      activity={runActivity}
      isSubmitting={false}
      onClose={onClose}
      onEdit={vi.fn().mockRejectedValue(new Error("nope"))}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Unable to edit activity",
  );
  expect(onClose).not.toHaveBeenCalled();
});

test("shows validation errors without submitting", async () => {
  const onEdit = vi.fn();
  render(
    <EditActivityModal
      activity={runActivity}
      isSubmitting={false}
      onClose={vi.fn()}
      onEdit={onEdit}
    />,
  );
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByText("Enter an activity title")).toBeDefined();
  expect(onEdit).not.toHaveBeenCalled();
});

test("closes through every enabled dismissal control", () => {
  const onClose = vi.fn();
  render(
    <EditActivityModal
      activity={runActivity}
      isSubmitting={false}
      onClose={onClose}
      onEdit={vi.fn()}
    />,
  );
  fireEvent.keyDown(window, { key: "Tab" });
  fireEvent.keyDown(window, { key: "Escape" });
  fireEvent.click(
    screen.getByRole("button", { name: "Dismiss edit activity" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Close edit activity" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onClose).toHaveBeenCalledTimes(4);
});

test("locks dismissal and reports pending submission", () => {
  const onClose = vi.fn();
  render(
    <EditActivityModal
      activity={runActivity}
      isSubmitting
      onClose={onClose}
      onEdit={vi.fn()}
    />,
  );
  fireEvent.keyDown(window, { key: "Escape" });
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Saving…" })).toHaveProperty(
    "disabled",
    true,
  );
  expect(screen.getByRole("button", { name: "Cancel" })).toHaveProperty(
    "disabled",
    true,
  );
});

test("renders strength duration as read-only context", () => {
  render(
    <EditActivityModal
      activity={strengthActivity}
      isSubmitting={false}
      onClose={vi.fn()}
      onEdit={vi.fn()}
    />,
  );
  expect(screen.getByText("45 min")).toBeDefined();
  expect(screen.queryByLabelText("Duration (minutes)")).toBeNull();
});

test.each([
  {
    ...runActivity,
    status: "COMPLETED" as const,
    timeOfDay: null,
    targetType: "DISTANCE_DURATION" as const,
    targetDurationSeconds: 1800,
    targetPaceSecondsPerKilometre: null,
  },
  {
    ...runActivity,
    status: "SKIPPED" as const,
    skipReason: "Rest",
    targetType: "DURATION_PACE" as const,
    targetDistanceMetres: null,
    targetDurationSeconds: 1800,
  },
])("renders terminal run fields as read-only context", (activity) => {
  render(
    <EditActivityModal
      activity={activity}
      isSubmitting={false}
      onClose={vi.fn()}
      onEdit={vi.fn()}
    />,
  );
  expect(screen.queryByLabelText("Time of day")).toBeNull();
  expect(screen.getByText(/6 km · 30 min|30 min · 4:15 \/ km/)).toBeDefined();
});

test("renders absent strength duration clearly", () => {
  render(
    <EditActivityModal
      activity={{ ...strengthActivity, targetDurationSeconds: null }}
      isSubmitting={false}
      onClose={vi.fn()}
      onEdit={vi.fn()}
    />,
  );
  expect(screen.getByText("No target duration")).toBeDefined();
});
