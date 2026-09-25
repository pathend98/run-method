import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { format, subDays } from "date-fns";

import { QueryProvider } from "@/app/query-provider";
import {
  createTrainingPlannerStore,
  TrainingPlannerStoreProvider,
} from "@/ui/training-planner/training-planner-store";
import { PastActivitiesAttentionPanel } from "./past-activities-attention-panel";

const session = {
  id: "11111111-1111-4111-8111-111111111111",
  athleteId: "33333333-3333-4333-8333-333333333333",
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
};

const athleteId = "33333333-3333-4333-8333-333333333333";

function stubFetch(fetchMock: (url: string, options?: RequestInit) => unknown) {
  vi.stubGlobal("fetch", (url: string, options?: RequestInit) =>
    url === "/api/v1/me"
      ? Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue({ id: athleteId }),
        })
      : options === undefined
        ? fetchMock(url)
        : fetchMock(url, options),
  );
}

function renderPanel(className?: string) {
  const store = createTrainingPlannerStore();
  render(
    <TrainingPlannerStoreProvider store={store}>
      <QueryProvider>
        <PastActivitiesAttentionPanel className={className} />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );
  return store;
}

test("renders a compact attention panel and fetches past scheduled activities", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: vi
      .fn()
      .mockResolvedValue([
        session,
        { ...session, id: "22222222-2222-4222-8222-222222222222" },
      ]),
  });
  stubFetch(fetchMock);
  const store = renderPanel("mb-8");

  const heading = await screen.findByText("2 activities need your attention.");
  expect(heading).toBeDefined();
  expect(
    screen.getByLabelText("Activities requiring attention").classList,
  ).toContain("mb-8");
  expect(
    screen.getByText("Past activities are waiting to be completed."),
  ).toBeDefined();
  expect(fetchMock).toHaveBeenCalledWith(
    `/api/v1/athletes/${athleteId}/training-sessions?to=${format(subDays(new Date(), 1), "yyyy-MM-dd")}&status=SCHEDULED`,
  );
  fireEvent.click(screen.getByRole("button", { name: "Review activities" }));
  expect(store.getState().activeModal).toEqual({ kind: "review" });
});

test("does not render when no activity needs attention", async () => {
  stubFetch(
    vi
      .fn()
      .mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue([]) }),
  );
  renderPanel();

  await waitFor(() =>
    expect(
      screen.queryByLabelText("Activities requiring attention"),
    ).toBeNull(),
  );
});

test("uses singular grammar for one activity", async () => {
  stubFetch(
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([session]),
    }),
  );
  renderPanel();

  expect(
    await screen.findByText("1 activity needs your attention."),
  ).toBeDefined();
});
