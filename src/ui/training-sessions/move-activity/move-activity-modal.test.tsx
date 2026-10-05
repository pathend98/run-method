import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import type { RunTrainingSession } from "@/domain/training-sessions";
import {
  createRunActivity,
  createStrengthActivity,
} from "@/test-support/fixtures/activity";
import {
  createTrainingPlannerStore,
  TrainingPlannerStoreProvider,
} from "@/ui/training-planner/training-planner-store";
import { MoveActivityModal } from "./move-activity-modal";

const api = vi.hoisted(() => ({ editTrainingSession: vi.fn() }));

vi.mock("@/ui/training-sessions/api", async (importOriginal) => ({
  ...(await importOriginal()),
  editTrainingSession: api.editTrainingSession,
}));

const activity = createRunActivity({
  date: "2026-09-10",
  timeOfDay: "PM",
  description: "Controlled effort",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1530,
}) satisfies RunTrainingSession;

function renderMoveActivityModal(
  onEdit: (id: string, request: unknown) => Promise<RunTrainingSession> = vi
    .fn()
    .mockResolvedValue(activity),
) {
  const store = createTrainingPlannerStore();
  store.getState().openActivityDetails({ ...activity, day: "Thursday" });
  act(() => store.getState().openMoveActivity());
  api.editTrainingSession.mockImplementation(onEdit);

  return {
    store,
    ...render(
      <TrainingPlannerStoreProvider store={store}>
        <QueryProvider>
          <MoveActivityModal />
        </QueryProvider>
      </TrainingPlannerStoreProvider>,
    ),
  };
}

test("shows the activity's week and current scheduling values", () => {
  renderMoveActivityModal();

  expect(screen.getByRole("dialog", { name: "Move Tempo run" })).toBeDefined();
  expect(screen.getByLabelText("Day")).toHaveProperty("value", "2026-09-10");
  expect(screen.getByLabelText("Time")).toHaveProperty("value", "PM");
  expect(
    screen.getByText("When do you want to do this activity?"),
  ).toBeDefined();
  expect(screen.getAllByRole("option")).toHaveLength(10);
  expect(screen.getByRole("option", { name: "Monday 7 Sep" })).toBeDefined();
  expect(screen.getByRole("option", { name: "Sunday 13 Sep" })).toBeDefined();
});

test("returns to activity details when cancelled or dismissed", () => {
  const { store } = renderMoveActivityModal();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(store.getState().activeModal?.kind).toBe("details");

  act(() => store.getState().openMoveActivity());
  fireEvent.click(
    screen.getByRole("button", { name: "Dismiss move activity" }),
  );
  expect(store.getState().activeModal?.kind).toBe("details");
});

test("moves the activity and returns to the training planner", async () => {
  const onEdit = vi.fn().mockResolvedValue({
    ...activity,
    date: "2026-09-11",
    timeOfDay: "AM",
  });
  const { store } = renderMoveActivityModal(onEdit);
  fireEvent.change(screen.getByLabelText("Day"), {
    target: { value: "2026-09-11" },
  });
  fireEvent.change(screen.getByLabelText("Time"), {
    target: { value: "ANY" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Move" }));

  await waitFor(() => expect(onEdit).toHaveBeenCalledOnce());
  expect(onEdit).toHaveBeenCalledWith(activity.id, {
    title: activity.title,
    date: "2026-09-11",
    timeOfDay: null,
    description: activity.description,
    activityType: "RUN",
    targetDistanceMetres: activity.targetDistanceMetres,
    targetDurationSeconds: activity.targetDurationSeconds,
  });
  expect(store.getState().activeModal).toBeNull();
});

test("moves a strength activity with its existing duration", async () => {
  const strengthActivity = createStrengthActivity({
    id: "22222222-2222-4222-8222-222222222222",
    title: activity.title,
    date: activity.date,
    timeOfDay: null,
    description: activity.description,
    targetDurationSeconds: null,
  });
  const store = createTrainingPlannerStore();
  store
    .getState()
    .openActivityDetails({ ...strengthActivity, day: "Thursday" });
  store.getState().openMoveActivity();
  const onEdit = vi.fn().mockResolvedValue(strengthActivity);
  api.editTrainingSession.mockImplementation(onEdit);
  render(
    <TrainingPlannerStoreProvider store={store}>
      <QueryProvider>
        <MoveActivityModal />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Move" }));
  await waitFor(() => expect(onEdit).toHaveBeenCalledOnce());
  expect(onEdit).toHaveBeenCalledWith(strengthActivity.id, {
    title: strengthActivity.title,
    date: strengthActivity.date,
    timeOfDay: strengthActivity.timeOfDay,
    description: strengthActivity.description,
    activityType: "STRENGTH",
    targetDurationSeconds: null,
  });
});

test("keeps the modal open and permits retrying after a failed move", async () => {
  const onEdit = vi
    .fn()
    .mockRejectedValueOnce(new Error("nope"))
    .mockResolvedValue(activity);
  renderMoveActivityModal(onEdit);
  fireEvent.click(screen.getByRole("button", { name: "Move" }));

  expect((await screen.findByRole("alert")).textContent).toContain(
    "Unable to move activity",
  );
  fireEvent.click(screen.getByRole("button", { name: "Move" }));
  await waitFor(() => expect(onEdit).toHaveBeenCalledTimes(2));
});

test("disables dismissal while moving", async () => {
  renderMoveActivityModal(() => new Promise(() => undefined));
  fireEvent.click(screen.getByRole("button", { name: "Move" }));

  expect(await screen.findByRole("button", { name: "Moving…" })).toHaveProperty(
    "disabled",
    true,
  );
  expect(screen.getByRole("button", { name: "Cancel" })).toHaveProperty(
    "disabled",
    true,
  );
});
