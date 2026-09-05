import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import {
  createTrainingPlannerStore,
  TrainingPlannerStoreProvider,
} from "@/ui/training-planner/training-planner-store";
import { SkipActivityModal } from "./skip-activity-modal";

const api = vi.hoisted(() => ({ skipTrainingSession: vi.fn() }));
vi.mock(
  "@/ui/training-sessions/training-sessions-api-client",
  async (importOriginal) => ({
    ...(await importOriginal()),
    skipTrainingSession: api.skipTrainingSession,
  }),
);

const activity = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Easy run",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: null,
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  activityType: "RUN",
  targetDistanceMetres: 8000,
  targetDurationSeconds: 2400,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
  day: "Monday",
} as const;

function renderModal() {
  const store = createTrainingPlannerStore();
  store.getState().openActivityDetails(activity);
  store.getState().openSkipActivity();
  render(
    <TrainingPlannerStoreProvider store={store}>
      <QueryProvider>
        <SkipActivityModal />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );
  return store;
}

test("shows the compact skip dialog and returns to details when cancelled", () => {
  const store = renderModal();
  expect(screen.getByRole("dialog", { name: "Easy run" })).toBeDefined();
  expect(screen.getByText("Why are you skipping this activity?")).toBeDefined();
  expect(screen.getByText("8.0 km · 40m · 5:00 / km")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(store.getState().activeModal).toMatchObject({ kind: "details" });
});

test("validates, skips, and closes the modal flow", async () => {
  api.skipTrainingSession.mockResolvedValue(activity);
  const store = renderModal();
  fireEvent.click(screen.getByRole("button", { name: "Skip activity" }));
  expect(await screen.findByText("Enter a skip reason")).toBeDefined();
  fireEvent.change(screen.getByLabelText("Why are you skipping this activity?"), {
    target: { value: "Recovery" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Skip activity" }));
  await waitFor(() =>
    expect(api.skipTrainingSession).toHaveBeenCalledWith(activity.id, {
      skipReason: "Recovery",
    }),
  );
  expect(store.getState().activeModal).toBeNull();
});

test("reports errors and prevents dismissal while skipping", async () => {
  api.skipTrainingSession.mockImplementation(
    () => new Promise(() => undefined),
  );
  const store = renderModal();
  fireEvent.change(screen.getByLabelText("Why are you skipping this activity?"), {
    target: { value: "Recovery" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Skip activity" }));
  expect(
    await screen.findByRole("button", { name: "Skipping…" }),
  ).toHaveProperty("disabled", true);
  expect(
    screen.getByRole("button", { name: "Dismiss skip activity" }),
  ).toHaveProperty("disabled", true);
  expect(store.getState().activeModal).toMatchObject({ kind: "skip" });
});
