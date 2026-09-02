import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { RunTrainingSession } from "@/domain/training-sessions";
import {
  createTrainingPlannerStore,
  type TrainingPlannerModalOperations,
  TrainingPlannerStoreProvider,
} from "@/ui/training-planner/training-planner-store";
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

type EditActivityModalTestProps = {
  isSubmitting?: boolean;
  onEdit?: TrainingPlannerModalOperations["editActivity"];
};

function renderEditActivityModal(props: EditActivityModalTestProps = {}) {
  const store = createTrainingPlannerStore();
  store.getState().openActivityDetails({ ...activity, day: "Monday" });
  store.getState().openEditActivity();
  store.getState().setModalOperations({
    createActivity: vi.fn(),
    editActivity: props.onEdit ?? vi.fn().mockResolvedValue(activity),
    deleteActivity: vi.fn(),
    skipActivity: vi.fn(),
    completeActivity: vi.fn(),
    isCreatingActivity: false,
    isEditingActivity: props.isSubmitting ?? false,
    isDeletingActivity: false,
    isTransitioningActivity: false,
  } as TrainingPlannerModalOperations);

  return {
    store,
    ...render(
      <TrainingPlannerStoreProvider store={store}>
        <EditActivityModal />
      </TrainingPlannerStoreProvider>,
    ),
  };
}

test("renders the selected activity and returns to details when dismissed", () => {
  const { store } = renderEditActivityModal();
  expect(screen.getByRole("dialog", { name: "Edit activity" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(store.getState().activeModal?.kind).toBe("details");
});

test("updates the selected activity and returns to its details", async () => {
  const onEdit = vi
    .fn()
    .mockResolvedValue({ ...activity, title: "Updated tempo" });
  const { store } = renderEditActivityModal({ onEdit });
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Updated tempo" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(onEdit).toHaveBeenCalledOnce());
  expect(store.getState().activeModal).toMatchObject({
    kind: "details",
    activity: { title: "Updated tempo", day: "Monday" },
  });
});

test("keeps the modal open after a failed edit", async () => {
  renderEditActivityModal({ onEdit: vi.fn().mockRejectedValue(new Error("nope")) });
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Changed" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Unable to edit activity",
  );
});

test("renders nothing when edit activity is not active", () => {
  render(
    <TrainingPlannerStoreProvider>
      <EditActivityModal />
    </TrainingPlannerStoreProvider>,
  );

  expect(screen.queryByRole("dialog", { name: "Edit activity" })).toBeNull();
});

test("shows its submitting state", () => {
  renderEditActivityModal({ isSubmitting: true });
  expect(screen.getByRole("button", { name: "Saving…" })).toHaveProperty(
    "disabled",
    true,
  );
});
