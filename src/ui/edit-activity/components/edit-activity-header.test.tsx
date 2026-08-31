import { fireEvent, render, screen } from "@testing-library/react";

import type { RunTrainingSession } from "@/domain/training-sessions";
import { EditActivityHeader } from "./edit-activity-header";

const activity = {
  activityType: "RUN",
  date: "2026-08-17",
} as RunTrainingSession;

test("renders activity context and closes when enabled", () => {
  const onClose = vi.fn();
  render(
    <EditActivityHeader
      activity={activity}
      isSubmitting={false}
      onClose={onClose}
    />,
  );

  expect(screen.getByText("Run · 2026-08-17")).toBeDefined();
  expect(screen.getByRole("heading", { name: "Edit activity" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Close edit activity" }));
  expect(onClose).toHaveBeenCalledOnce();
});

test("disables closing while submitting", () => {
  const onClose = vi.fn();
  render(
    <EditActivityHeader activity={activity} isSubmitting onClose={onClose} />,
  );

  const closeButton = screen.getByRole("button", {
    name: "Close edit activity",
  });
  expect(closeButton).toHaveProperty("disabled", true);
  fireEvent.click(closeButton);
  expect(onClose).not.toHaveBeenCalled();
});
