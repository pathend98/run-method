import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AddActivityModal } from "./add-activity-modal";

const day = {
  day: "Monday",
  date: "2026-08-17",
};

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

test("closes through each enabled dismissal control", () => {
  const onClose = vi.fn();
  const { rerender } = render(
    <AddActivityModal
      day={day}
      isSubmitting={false}
      onClose={onClose}
      onCreate={vi.fn()}
    />,
  );

  fireEvent.keyDown(window, { key: "Tab" });
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.keyDown(window, { key: "Escape" });
  fireEvent.click(screen.getByRole("button", { name: "Dismiss add activity" }));
  fireEvent.click(screen.getByRole("button", { name: "Close add activity" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onClose).toHaveBeenCalledTimes(4);

  rerender(
    <AddActivityModal
      day={day}
      isSubmitting
      onClose={onClose}
      onCreate={vi.fn()}
    />,
  );
  fireEvent.keyDown(window, { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(4);
  expect(
    (screen.getByRole("button", { name: "Adding…" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(
    (screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
});

test("switches activity fields while preserving hidden run values", () => {
  render(
    <AddActivityModal
      day={day}
      isSubmitting={false}
      onClose={vi.fn()}
      onCreate={vi.fn()}
    />,
  );

  const activityType = screen.getByLabelText("Activity type");

  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "8" },
  });
  fireEvent.change(activityType, { target: { value: "STRENGTH" } });
  expect(screen.queryByLabelText("Run target")).toBeNull();
  expect(screen.getByLabelText("Duration (minutes, optional)")).toBeDefined();
  expect(screen.queryByLabelText("Distance (km)")).toBeNull();
  expect(screen.queryByLabelText("Pace (mm:ss / km)")).toBeNull();

  fireEvent.change(activityType, { target: { value: "RUN" } });
  expect((screen.getByLabelText("Distance (km)") as HTMLInputElement).value).toBe(
    "8",
  );

  const targetType = screen.getByLabelText("Run target");
  fireEvent.change(targetType, { target: { value: "DISTANCE_PACE" } });
  expect(screen.getByLabelText("Distance (km)")).toBeDefined();
  expect(screen.getByLabelText("Pace (mm:ss / km)")).toBeDefined();
  expect(screen.queryByLabelText("Duration (minutes)")).toBeNull();

  fireEvent.change(targetType, { target: { value: "DURATION_PACE" } });
  expect(screen.queryByLabelText("Distance (km)")).toBeNull();
  expect(screen.getByLabelText("Duration (minutes)")).toBeDefined();
  expect(screen.getByLabelText("Pace (mm:ss / km)")).toBeDefined();
});

test("renders validation messages for invalid visible fields", async () => {
  render(
    <AddActivityModal
      day={day}
      isSubmitting={false}
      onClose={vi.fn()}
      onCreate={vi.fn()}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Add activity" }));

  expect(await screen.findByText("Enter an activity title")).toBeDefined();
  expect(screen.getByText("Enter a distance in kilometres")).toBeDefined();
  expect(screen.getByText("Enter whole minutes")).toBeDefined();
});
