import { createRunTrainingSession } from "@/test-support/fixtures/training-session";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type {
  RunTrainingSession,
  TrainingSession,
} from "@/domain/training-sessions";
import type { TrainingSessionMoveDestination } from "@/ui/training-sessions/move-training-session/create-move-training-session-request";
import type { PlannerTrainingSession } from "./calendar/training-calendar-types";
import { QueryProvider } from "@/app/query-provider";
import { createUser } from "@/test-support/fixtures/user";
import { TrainingSessionDialogsStoreProvider } from "@/ui/training-sessions/training-session-dialogs";

const navigation = vi.hoisted(() => ({
  pathname: "/",
  push: vi.fn(),
  search: "",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

vi.mock("./presentation/training-planner-view", () => ({
  TrainingPlannerView: ({
    onMoveTrainingSession,
    sessions,
  }: {
    onMoveTrainingSession: (
      trainingSession: PlannerTrainingSession,
      destination: TrainingSessionMoveDestination,
    ) => Promise<void>;
    sessions: TrainingSession[];
  }) => (
    <button
      onClick={() =>
        void onMoveTrainingSession(
          { ...sessions[0], day: "Monday" } as PlannerTrainingSession,
          { date: "2026-09-08", timeOfDay: "PM" },
        )
      }
      type="button"
    >
      Move training session
    </button>
  ),
}));

import { TrainingPlanner } from "./training-planner";

const trainingSession = createRunTrainingSession({
  title: "Easy run",
  date: "2026-09-07",
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1800,
}) satisfies RunTrainingSession;

test("persists a drag move through the existing edit mutation", async () => {
  const fetchMock = vi.fn().mockImplementation((_url, options) => {
    if (_url === "/api/v1/me") {
      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue(
          createUser({
            id: "33333333-3333-4333-8333-333333333333",
          }),
        ),
      });
    }
    if (options?.method === "PATCH") {
      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue({
          ...trainingSession,
          date: "2026-09-08",
          timeOfDay: "PM",
        }),
      });
    }

    return Promise.resolve({
      ok: true,
      json: vi.fn().mockResolvedValue([trainingSession]),
    });
  });
  vi.stubGlobal("fetch", fetchMock);

  render(
    <TrainingSessionDialogsStoreProvider>
      <QueryProvider>
        <TrainingPlanner />
      </QueryProvider>
    </TrainingSessionDialogsStoreProvider>,
  );
  await screen.findByRole("button", { name: "Move training session" });
  fireEvent.click(
    screen.getByRole("button", { name: "Move training session" }),
  );

  await waitFor(() =>
    expect(
      fetchMock.mock.calls.filter(([, options]) => options?.method === "PATCH"),
    ).toHaveLength(1),
  );
  expect(fetchMock).toHaveBeenCalledWith(
    `/api/v1/training-sessions/${trainingSession.id}`,
    expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({
        title: trainingSession.title,
        date: "2026-09-08",
        timeOfDay: "PM",
        description: trainingSession.description,
        activityType: "RUN",
        targetDistanceMetres: trainingSession.targetDistanceMetres,
        targetDurationSeconds: trainingSession.targetDurationSeconds,
      }),
    }),
  );
});
