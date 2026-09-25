import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type {
  RunTrainingSession,
  TrainingSession,
} from "@/domain/training-sessions";
import type { TrainingSessionMoveDestination } from "@/ui/training-sessions/create-move-training-session-request";
import type { TrainingActivity } from "./types/training-planner-types";
import { QueryProvider } from "@/app/query-provider";
import { TrainingPlannerStoreProvider } from "./training-planner-store";

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

vi.mock("./components/training-planner-view", () => ({
  TrainingPlannerView: ({
    onMoveActivity,
    sessions,
  }: {
    onMoveActivity: (
      activity: TrainingActivity,
      destination: TrainingSessionMoveDestination,
    ) => Promise<void>;
    sessions: TrainingSession[];
  }) => (
    <button
      onClick={() =>
        void onMoveActivity(
          { ...sessions[0], day: "Monday" } as TrainingActivity,
          { date: "2026-09-08", timeOfDay: "PM" },
        )
      }
      type="button"
    >
      Move activity
    </button>
  ),
}));

import { TrainingPlanner } from "./training-planner";

const activity = {
  id: "11111111-1111-4111-8111-111111111111",
  athleteId: "33333333-3333-4333-8333-333333333333",
  title: "Easy run",
  activityType: "RUN",
  status: "SCHEDULED",
  date: "2026-09-07",
  timeOfDay: "AM",
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1800,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
} satisfies RunTrainingSession;

test("persists a drag move through the existing edit mutation", async () => {
  const fetchMock = vi.fn().mockImplementation((_url, options) => {
    if (_url === "/api/v1/me") {
      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: "33333333-3333-4333-8333-333333333333",
        }),
      });
    }
    if (options?.method === "PATCH") {
      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue({
          ...activity,
          date: "2026-09-08",
          timeOfDay: "PM",
        }),
      });
    }

    return Promise.resolve({
      ok: true,
      json: vi.fn().mockResolvedValue([activity]),
    });
  });
  vi.stubGlobal("fetch", fetchMock);

  render(
    <TrainingPlannerStoreProvider>
      <QueryProvider>
        <TrainingPlanner />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );
  await screen.findByRole("button", { name: "Move activity" });
  fireEvent.click(screen.getByRole("button", { name: "Move activity" }));

  await waitFor(() =>
    expect(
      fetchMock.mock.calls.filter(([, options]) => options?.method === "PATCH"),
    ).toHaveLength(1),
  );
  expect(fetchMock).toHaveBeenCalledWith(
    `/api/v1/training-sessions/${activity.id}`,
    expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({
        title: activity.title,
        date: "2026-09-08",
        timeOfDay: "PM",
        description: activity.description,
        activityType: "RUN",
        targetDistanceMetres: activity.targetDistanceMetres,
        targetDurationSeconds: activity.targetDurationSeconds,
      }),
    }),
  );
});
