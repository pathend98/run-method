import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import {
  createRunTrainingSession,
  createStrengthTrainingSession,
} from "@/test-support/fixtures/training-session";
import {
  createTrainingPlannerStore,
  TrainingPlannerStoreProvider,
} from "@/ui/training-planner/training-planner-store";
import { CompleteTrainingSessionModal } from "./complete-training-session-modal";
import { DistanceDisplayProvider } from "@/ui/users/measurement-unit-context";

const api = vi.hoisted(() => ({ completeTrainingSession: vi.fn() }));
vi.mock("@/ui/training-sessions/api", async (importOriginal) => ({
  ...(await importOriginal()),
  completeTrainingSession: api.completeTrainingSession,
}));

const trainingSession = {
  ...createRunTrainingSession({
    timeOfDay: null,
    targetDistanceMetres: 6000,
    targetDurationSeconds: 1530,
  }),
  day: "Monday",
} as const;

function renderModal(
  measurementUnit: "KILOMETRES" | "MILES" = "KILOMETRES",
  fromReview = false,
) {
  const store = createTrainingPlannerStore();
  if (fromReview) {
    store.getState().openCompleteTrainingSessionFromReview(trainingSession);
  } else {
    store.getState().openActivityDetails(trainingSession);
    store.getState().openCompleteTrainingSession();
  }
  render(
    <TrainingPlannerStoreProvider store={store}>
      <QueryProvider>
        <DistanceDisplayProvider measurementUnit={measurementUnit}>
          <CompleteTrainingSessionModal />
        </DistanceDisplayProvider>
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );
  return store;
}

test("renders nothing when completion is not active", () => {
  const store = createTrainingPlannerStore();
  render(
    <TrainingPlannerStoreProvider store={store}>
      <QueryProvider>
        <CompleteTrainingSessionModal />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("shows the focused completion dialog and returns to details when cancelled", () => {
  const store = renderModal();
  expect(screen.getByRole("dialog", { name: "Tempo run" })).toBeDefined();
  expect(screen.getByText("How did it go?")).toBeDefined();
  expect(
    screen.getByText("Planned: 6.0 km · 25m 30s · 4:15 / km"),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(store.getState().activeModal).toMatchObject({ kind: "details" });
});

test("shows planned miles and mile pace with mile completion inputs", () => {
  renderModal("MILES");
  expect(
    screen.getByText("Planned: 3.7 mi · 25m 30s · 6:50 / mi"),
  ).toBeDefined();
  expect(screen.getByLabelText("Distance (mi)")).toHaveProperty(
    "value",
    "3.728",
  );
  expect(screen.getByLabelText("Pace (mm:ss / mi) · Auto")).toHaveProperty(
    "value",
    "6:50",
  );
});

test("completes the training session and closes the modal flow", async () => {
  api.completeTrainingSession.mockResolvedValue(trainingSession);
  const store = renderModal();
  fireEvent.click(
    screen.getByRole("button", { name: "Complete training session" }),
  );
  await waitFor(() =>
    expect(api.completeTrainingSession).toHaveBeenCalledWith(
      trainingSession.id,
      {
        actualDistanceMetres: 6000,
        actualDurationSeconds: 1530,
      },
    ),
  );
  expect(store.getState().activeModal).toBeNull();
});

test("disables dismissal while completion is pending", async () => {
  api.completeTrainingSession.mockImplementation(
    () => new Promise(() => undefined),
  );
  renderModal();
  fireEvent.click(
    screen.getByRole("button", { name: "Complete training session" }),
  );
  expect(
    await screen.findByRole("button", { name: "Completing…" }),
  ).toHaveProperty("disabled", true);
  expect(
    screen.getByRole("button", { name: "Dismiss complete training session" }),
  ).toHaveProperty("disabled", true);
});

test("shows a duration-only completion dialog for strength", () => {
  const store = createTrainingPlannerStore();
  store.getState().openActivityDetails({
    ...createStrengthTrainingSession({
      id: trainingSession.id,
      title: trainingSession.title,
      date: trainingSession.date,
      timeOfDay: trainingSession.timeOfDay,
      description: trainingSession.description,
      targetDurationSeconds: 1800,
    }),
    day: "Monday",
  });
  store.getState().openCompleteTrainingSession();
  render(
    <TrainingPlannerStoreProvider store={store}>
      <QueryProvider>
        <CompleteTrainingSessionModal />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );
  expect(screen.queryByText(/Planned:/)).toBeNull();
  expect(screen.getByLabelText("Actual duration (minutes)")).toHaveProperty(
    "value",
    "30",
  );
});

test("returns to review when completing a training session is cancelled", () => {
  const store = renderModal("KILOMETRES", true);
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(store.getState().activeModal).toEqual({ kind: "review" });
});

test("returns to review after successfully completing a training session", async () => {
  api.completeTrainingSession.mockResolvedValue(trainingSession);
  const store = renderModal("KILOMETRES", true);
  expect(store.getState().activeModal).toEqual({
    kind: "complete",
    trainingSession,
    returnTo: "review",
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Complete training session" }),
  );
  await waitFor(() => {
    expect(api.completeTrainingSession).toHaveBeenCalledWith(
      trainingSession.id,
      {
        actualDistanceMetres: 6000,
        actualDurationSeconds: 1530,
      },
    );
    expect(store.getState().activeModal).toEqual({ kind: "review" });
  });
});
