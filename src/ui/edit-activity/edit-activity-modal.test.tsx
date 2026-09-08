import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import type { RunTrainingSession } from "@/domain/training-sessions";
import {
  createTrainingPlannerStore,
  TrainingPlannerStoreProvider,
} from "@/ui/training-planner/training-planner-store";
import { EditActivityModal } from "./edit-activity-modal";

const api = vi.hoisted(() => ({ editTrainingSession: vi.fn() }));

vi.mock(
  "@/ui/training-sessions/training-sessions-api-client",
  async (importOriginal) => ({
    ...(await importOriginal()),
    editTrainingSession: api.editTrainingSession,
  }),
);

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
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1530,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
} satisfies RunTrainingSession;

type EditActivityModalTestProps = {
  onEdit?: (id: string, request: unknown) => Promise<RunTrainingSession>;
};

function renderEditActivityModal(props: EditActivityModalTestProps = {}) {
  const store = createTrainingPlannerStore();
  store.getState().openActivityDetails({ ...activity, day: "Monday" });
  store.getState().openEditActivity();
  api.editTrainingSession.mockImplementation(
    props.onEdit ?? vi.fn().mockResolvedValue(activity),
  );

  return {
    store,
    ...render(
      <TrainingPlannerStoreProvider store={store}>
        <QueryProvider>
          <EditActivityModal />
        </QueryProvider>
      </TrainingPlannerStoreProvider>,
    ),
  };
}

test("renders the selected activity and returns to details when dismissed", () => {
  const { store } = renderEditActivityModal();
  expect(screen.getByRole("dialog", { name: "Edit activity" })).toBeDefined();
  expect(screen.getByText("Run · Monday, 17 August")).toBeDefined();
  expect(screen.queryByText("2026-08-17")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(store.getState().activeModal?.kind).toBe("details");
});

test("updates the selected activity and closes the edit flow", async () => {
  const onEdit = vi
    .fn()
    .mockResolvedValue({ ...activity, title: "Updated tempo" });
  const { store } = renderEditActivityModal({ onEdit });
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Updated tempo" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(onEdit).toHaveBeenCalledOnce());
  expect(store.getState().activeModal).toBeNull();
  expect(screen.queryByRole("dialog", { name: "Edit activity" })).toBeNull();
});

test("keeps the modal open after a failed edit", async () => {
  renderEditActivityModal({
    onEdit: vi.fn().mockRejectedValue(new Error("nope")),
  });
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
      <QueryProvider>
        <EditActivityModal />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );

  expect(screen.queryByRole("dialog", { name: "Edit activity" })).toBeNull();
});

test("shows its submitting state", async () => {
  renderEditActivityModal({ onEdit: () => new Promise(() => undefined) });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByRole("button", { name: "Saving…" })).toHaveProperty(
    "disabled",
    true,
  );
});

test("disables saving while an automatic metric edit needs a choice", () => {
  renderEditActivityModal();
  const dialog = screen.getByRole("dialog", { name: "Edit activity" });
  expect(dialog.classList).toContain("max-w-4xl");

  const pace = screen.getByLabelText("Pace (mm:ss / km) · Auto");
  fireEvent.focus(pace);
  fireEvent.change(pace, { target: { value: "4:10" } });
  fireEvent.blur(pace);

  expect(screen.getByRole("button", { name: "Save changes" })).toHaveProperty(
    "disabled",
    true,
  );
  fireEvent.click(screen.getByRole("button", { name: "Keep distance" }));
  expect(screen.getByRole("button", { name: "Save changes" })).toHaveProperty(
    "disabled",
    false,
  );
});
