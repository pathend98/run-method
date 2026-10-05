import { createRunTrainingSession } from "@/test-support/fixtures/training-session";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import {
  createTrainingPlannerStore,
  TrainingPlannerStoreProvider,
} from "@/ui/training-planner/training-planner-store";
import { SkipTrainingSessionModal } from "./skip-training-session-modal";

const api = vi.hoisted(() => ({ skipTrainingSession: vi.fn() }));
vi.mock("@/ui/training-sessions/api", async (importOriginal) => ({
  ...(await importOriginal()),
  skipTrainingSession: api.skipTrainingSession,
}));

const trainingSession = {
  ...createRunTrainingSession({
    title: "Easy run",
    timeOfDay: null,
    targetDurationSeconds: 2400,
  }),
  day: "Monday",
} as const;

function renderModal(fromReview = false) {
  const store = createTrainingPlannerStore();
  if (fromReview) {
    store.getState().openSkipTrainingSessionFromReview(trainingSession);
  } else {
    store.getState().openTrainingSessionDetails(trainingSession);
    store.getState().openSkipTrainingSession();
  }
  render(
    <TrainingPlannerStoreProvider store={store}>
      <QueryProvider>
        <SkipTrainingSessionModal />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );
  return store;
}

test("shows the compact skip dialog and returns to details when cancelled", () => {
  const store = renderModal();
  expect(screen.getByRole("dialog", { name: "Easy run" })).toBeDefined();
  expect(
    screen.getByText("Why are you skipping this training session?"),
  ).toBeDefined();
  expect(screen.getByText("8.00 km · 40m · 5:00 / km")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(store.getState().activeModal).toMatchObject({ kind: "details" });
});

test("validates, skips, and closes the modal flow", async () => {
  api.skipTrainingSession.mockResolvedValue(trainingSession);
  const store = renderModal();
  fireEvent.click(
    screen.getByRole("button", { name: "Skip training session" }),
  );
  expect(await screen.findByText("Enter a skip reason")).toBeDefined();
  fireEvent.change(
    screen.getByLabelText("Why are you skipping this training session?"),
    {
      target: { value: "Recovery" },
    },
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Skip training session" }),
  );
  await waitFor(() =>
    expect(api.skipTrainingSession).toHaveBeenCalledWith(trainingSession.id, {
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
  fireEvent.change(
    screen.getByLabelText("Why are you skipping this training session?"),
    {
      target: { value: "Recovery" },
    },
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Skip training session" }),
  );
  expect(
    await screen.findByRole("button", { name: "Skipping…" }),
  ).toHaveProperty("disabled", true);
  expect(
    screen.getByRole("button", { name: "Dismiss skip training session" }),
  ).toHaveProperty("disabled", true);
  expect(store.getState().activeModal).toMatchObject({ kind: "skip" });
});

test("returns to review when skipping a training session is cancelled", () => {
  const store = renderModal(true);
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(store.getState().activeModal).toEqual({ kind: "review" });
});

test("returns to review after successfully skipping a training session", async () => {
  api.skipTrainingSession.mockResolvedValue(trainingSession);
  const store = renderModal(true);
  expect(store.getState().activeModal).toEqual({
    kind: "skip",
    trainingSession,
    returnTo: "review",
  });
  fireEvent.change(
    screen.getByLabelText("Why are you skipping this training session?"),
    { target: { value: "Recovery" } },
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Skip training session" }),
  );
  await waitFor(() => {
    expect(api.skipTrainingSession).toHaveBeenCalledWith(trainingSession.id, {
      skipReason: "Recovery",
    });
    expect(store.getState().activeModal).toEqual({ kind: "review" });
  });
});
