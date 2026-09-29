import { createRunActivity } from "@/test-support/fixtures/activity";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import {
  createTrainingPlannerStore,
  TrainingPlannerStoreProvider,
} from "@/ui/training-planner/training-planner-store";
import { DeleteActivityModal } from "./delete-activity-modal";

const api = vi.hoisted(() => ({ deleteTrainingSession: vi.fn() }));
vi.mock(
  "@/ui/training-sessions/training-sessions-api-client",
  async (importOriginal) => ({
    ...(await importOriginal()),
    deleteTrainingSession: api.deleteTrainingSession,
  }),
);

const activity = {
  ...createRunActivity({
    title: "Easy run",
    timeOfDay: null,
    targetDurationSeconds: 2400,
  }),
  day: "Monday",
} as const;

function renderModal() {
  const store = createTrainingPlannerStore();
  store.getState().openActivityDetails(activity);
  store.getState().openDeleteActivity();
  render(
    <TrainingPlannerStoreProvider store={store}>
      <QueryProvider>
        <DeleteActivityModal />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );
  return store;
}

test("renders nothing when deletion is not active", () => {
  render(
    <TrainingPlannerStoreProvider>
      <QueryProvider>
        <DeleteActivityModal />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("shows sticky footer confirmation actions and returns to details when cancelled", () => {
  const store = renderModal();
  expect(screen.getByRole("dialog", { name: "Easy run" })).toBeDefined();
  expect(screen.getByText("Delete this activity?")).toBeDefined();
  expect(screen.queryByText(/Delete “Easy run”\?/)).toBeNull();
  expect(screen.getByText("This action cannot be undone.")).toBeDefined();
  const cancel = screen.getByRole("button", { name: "Cancel" });
  expect(cancel.parentElement?.classList).toContain("sticky");
  expect(cancel.parentElement?.classList).toContain("bottom-0");
  fireEvent.click(cancel);
  expect(store.getState().activeModal).toMatchObject({ kind: "details" });
});

test("returns to details when dismissed by the cross, backdrop, or Escape", () => {
  const store = renderModal();
  fireEvent.click(
    screen.getByRole("button", { name: "Close delete activity" }),
  );
  expect(store.getState().activeModal).toMatchObject({ kind: "details" });

  act(() => store.getState().openDeleteActivity());
  fireEvent.click(
    screen.getByRole("button", { name: "Dismiss delete activity" }),
  );
  expect(store.getState().activeModal).toMatchObject({ kind: "details" });

  act(() => store.getState().openDeleteActivity());
  fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
  expect(store.getState().activeModal).toMatchObject({ kind: "details" });
});

test("deletes the activity and closes after success", async () => {
  api.deleteTrainingSession.mockResolvedValue(undefined);
  const store = renderModal();
  fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
  await waitFor(() =>
    expect(api.deleteTrainingSession).toHaveBeenCalledWith(activity.id),
  );
  expect(store.getState().activeModal).toBeNull();
});

test("reports deletion failures", async () => {
  api.deleteTrainingSession.mockRejectedValue(new Error("nope"));
  renderModal();
  fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Unable to delete activity",
  );
});

test("disables actions and dismissal while deleting", async () => {
  api.deleteTrainingSession.mockImplementation(
    () => new Promise(() => undefined),
  );
  const store = renderModal();
  fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
  expect(
    await screen.findByRole("button", { name: "Deleting…" }),
  ).toHaveProperty("disabled", true);
  expect(screen.getByRole("button", { name: "Cancel" })).toHaveProperty(
    "disabled",
    true,
  );
  expect(
    screen.getByRole("button", { name: "Dismiss delete activity" }),
  ).toHaveProperty("disabled", true);
  fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
  expect(store.getState().activeModal).toMatchObject({ kind: "delete" });
});
