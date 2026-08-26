import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AddActivityModal } from "./add-activity-modal";
import type { TrainingDay } from "../types/training-planner-types";

const day = {
  day: "Monday",
  date: "2026-08-17",
  activities: [],
} satisfies TrainingDay;

test("submits a converted activity for its fixed day", async () => {
  const onCreate = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(
    <AddActivityModal
      day={day}
      isSubmitting={false}
      onClose={onClose}
      onCreate={onCreate}
    />,
  );

  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Easy run" },
  });
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "8" },
  });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "45" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add activity" }));

  await waitFor(() =>
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        date: "2026-08-17",
        targetDistanceMetres: 8000,
        targetDurationSeconds: 2700,
      }),
    ),
  );
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("keeps the form open and reports failed creation", async () => {
  render(
    <AddActivityModal
      day={day}
      isSubmitting={false}
      onClose={vi.fn()}
      onCreate={vi.fn().mockRejectedValue(new Error("nope"))}
    />,
  );
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Easy run" },
  });
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "8" },
  });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "45" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add activity" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Unable to add activity",
  );
});
