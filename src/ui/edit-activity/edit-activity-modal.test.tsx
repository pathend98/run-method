import { fireEvent, render, screen } from "@testing-library/react";

import type { RunTrainingSession } from "@/domain/training-sessions";
import { EditActivityModal } from "./edit-activity-modal";

const activity = {
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

test("renders the edit activity dialog and its sections", () => {
  render(
    <EditActivityModal
      activity={activity}
      isSubmitting={false}
      onClose={vi.fn()}
      onEdit={vi.fn()}
    />,
  );

  expect(screen.getByRole("dialog", { name: "Edit activity" })).toBeDefined();
  expect(screen.getByText("Run · 2026-08-17")).toBeDefined();
  expect(screen.getByText("Activity type")).toBeDefined();
  expect(screen.getByLabelText("Title")).toBeDefined();
});

test("closes through the backdrop and Escape key", () => {
  const onClose = vi.fn();
  render(
    <EditActivityModal
      activity={activity}
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

test("locks backdrop and Escape dismissal while submitting", () => {
  const onClose = vi.fn();
  render(
    <EditActivityModal
      activity={activity}
      isSubmitting
      onClose={onClose}
      onEdit={vi.fn()}
    />,
  );

  fireEvent.keyDown(window, { key: "Escape" });
  fireEvent.click(
    screen.getByRole("button", { name: "Dismiss edit activity" }),
  );
  expect(onClose).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: "Close edit activity" }),
  ).toHaveProperty("disabled", true);
  expect(screen.getByRole("button", { name: "Cancel" })).toHaveProperty(
    "disabled",
    true,
  );
  expect(screen.getByRole("button", { name: "Saving…" })).toHaveProperty(
    "disabled",
    true,
  );
});
