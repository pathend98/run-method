import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import type { TrainingSession } from "@/domain/training-sessions";
import {
  createTrainingPlannerStore,
  TrainingPlannerStoreProvider,
} from "@/ui/training-planner/training-planner-store";
import { ReviewActivitiesModal } from "./review-activities-modal";

const sessions = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Easy run",
    activityType: "RUN",
    status: "SCHEDULED",
    date: "2026-08-31",
    timeOfDay: "AM",
    description: null,
    sortOrder: 0,
    skipReason: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    targetDistanceMetres: 12000,
    targetDurationSeconds: 3360,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Tempo run",
    activityType: "RUN",
    status: "SCHEDULED",
    date: "2026-09-01",
    timeOfDay: "AM",
    description: null,
    sortOrder: 0,
    skipReason: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    targetDistanceMetres: 10000,
    targetDurationSeconds: 2880,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
  },
] satisfies TrainingSession[];

function renderModal(response: TrainingSession[] = sessions) {
  const store = createTrainingPlannerStore();
  store.getState().openReviewActivities();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(response),
    }),
  );
  render(
    <TrainingPlannerStoreProvider store={store}>
      <QueryProvider>
        <ReviewActivitiesModal />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );
  return store;
}

test("lists attention activities by date and opens their action flows", async () => {
  const store = renderModal();

  expect(
    await screen.findByRole("dialog", { name: "Activities needing attention" }),
  ).toBeDefined();
  expect(screen.getByText("2 activities remaining.")).toBeDefined();
  expect(screen.getByText("Mon 31 Aug")).toBeDefined();
  expect(screen.getByText("12.0 km · 56m")).toBeDefined();
  fireEvent.click(screen.getAllByRole("button", { name: "Complete" })[0]);
  expect(store.getState().activeModal).toMatchObject({
    kind: "complete",
    returnTo: "review",
  });
});

test("opens the skip flow from the review list", async () => {
  const store = renderModal();

  fireEvent.click((await screen.findAllByRole("button", { name: "Skip" }))[0]);
  expect(store.getState().activeModal).toMatchObject({
    kind: "skip",
    returnTo: "review",
  });
});

test("shows duration-only planned metrics for strength activities", async () => {
  renderModal([
    {
      id: "33333333-3333-4333-8333-333333333333",
      title: "Strength session",
      activityType: "STRENGTH",
      status: "SCHEDULED",
      date: "2026-09-01",
      timeOfDay: null,
      description: null,
      sortOrder: 0,
      skipReason: null,
      createdAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-01T10:00:00.000Z",
      targetDurationSeconds: 1800,
      actualDurationSeconds: null,
    },
  ]);

  expect(await screen.findByText("Strength session")).toBeDefined();
  expect(screen.getByText("30m")).toBeDefined();
});

test("closes from the review action and when no activities remain", async () => {
  const store = renderModal();
  await screen.findByRole("dialog");
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(store.getState().activeModal).toBeNull();

  const emptyStore = renderModal([]);
  await waitFor(() => expect(emptyStore.getState().activeModal).toBeNull());
});
