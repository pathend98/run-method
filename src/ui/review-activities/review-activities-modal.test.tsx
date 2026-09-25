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
    title: "Easy run 2",
    activityType: "RUN",
    status: "SCHEDULED",
    date: "2026-08-31",
    timeOfDay: "AM",
    description: null,
    sortOrder: 0,
    skipReason: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    targetDistanceMetres: 8000,
    targetDurationSeconds: 2460,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
  },
] satisfies TrainingSession[];

const athleteId = "33333333-3333-4333-8333-333333333333";

function renderModal(response: TrainingSession[] = sessions) {
  const store = createTrainingPlannerStore();
  store.getState().openReviewActivities();
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue(
            url === "/api/v1/me" ? { id: athleteId } : response,
          ),
      }),
    ),
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
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining(
      `/api/v1/athletes/${athleteId}/training-sessions?to=`,
    ),
  );
  expect(screen.getByText("2 activities remaining.")).toBeDefined();
  expect(screen.getByText("Mon 31 Aug")).toBeDefined();
  expect(screen.getByText("12.00 km · 56m")).toBeDefined();
  expect(screen.getByText("Easy run 2")).toBeDefined();
  expect(screen.getByText("8.00 km · 41m")).toBeDefined();
  expect(screen.getAllByText("Mon 31 Aug")).toHaveLength(1);
  const dateGroup = screen.getByText("Mon 31 Aug").closest("section");
  expect(dateGroup?.classList.contains("grid")).toBe(true);
  expect(dateGroup?.parentElement?.classList.contains("divide-y")).toBe(true);
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
