import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import {
  createTrainingPlannerStore,
  TrainingPlannerStoreProvider,
} from "@/ui/training-planner/training-planner-store";
import { AddActivityModal } from "./add-activity-modal";

const day = { day: "Monday" as const, date: "2026-08-17", activities: [] };

function renderAddActivityModal(
  props: Partial<React.ComponentProps<typeof AddActivityModal>> = {},
) {
  const store = createTrainingPlannerStore();
  store.getState().openAddActivity(day);

  return {
    store,
    ...render(
      <TrainingPlannerStoreProvider store={store}>
        <AddActivityModal
          isSubmitting={false}
          onCreate={vi.fn().mockResolvedValue(undefined)}
          {...props}
        />
      </TrainingPlannerStoreProvider>,
    ),
  };
}

test("submits a converted activity for its selected day and closes", async () => {
  const onCreate = vi.fn().mockResolvedValue(undefined);
  const { store } = renderAddActivityModal({ onCreate });

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
        date: day.date,
        targetDistanceMetres: 8000,
        targetDurationSeconds: 2700,
      }),
    ),
  );
  expect(store.getState().activeModal).toBeNull();
});

test("keeps the form open after a failed creation and supports dismissal", async () => {
  const { store } = renderAddActivityModal({
    onCreate: vi.fn().mockRejectedValue(new Error("nope")),
  });
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
  expect(store.getState().activeModal?.kind).toBe("add");

  fireEvent.click(screen.getByRole("button", { name: "Close add activity" }));
  expect(store.getState().activeModal).toBeNull();
});

test("switches activity fields and reports validation errors", async () => {
  renderAddActivityModal();
  const activityType = screen.getByLabelText("Activity type");
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "8" },
  });
  fireEvent.change(activityType, { target: { value: "STRENGTH" } });
  expect(screen.queryByLabelText("Run target")).toBeNull();
  fireEvent.change(activityType, { target: { value: "RUN" } });
  expect((screen.getByLabelText("Distance (km)") as HTMLInputElement).value).toBe(
    "8",
  );
  fireEvent.click(screen.getByRole("button", { name: "Add activity" }));
  expect(await screen.findByText("Enter an activity title")).toBeDefined();
});

test("renders nothing when add activity is not active", () => {
  render(
    <TrainingPlannerStoreProvider>
      <AddActivityModal isSubmitting={false} onCreate={vi.fn()} />
    </TrainingPlannerStoreProvider>,
  );

  expect(screen.queryByRole("dialog", { name: "Add activity" })).toBeNull();
});

test("shows its submitting state", () => {
  renderAddActivityModal({ isSubmitting: true });
  expect(screen.getByRole("button", { name: "Adding…" })).toHaveProperty(
    "disabled",
    true,
  );
});
