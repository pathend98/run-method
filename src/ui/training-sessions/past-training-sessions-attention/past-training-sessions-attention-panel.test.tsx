import { createRunTrainingSession } from "@/test-support/fixtures/training-session";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { format, subDays } from "date-fns";

import { QueryProvider } from "@/app/query-provider";
import { createUser } from "@/test-support/fixtures/user";
import {
  createTrainingSessionDialogsStore,
  TrainingSessionDialogsStoreProvider,
} from "@/ui/training-sessions/training-session-dialogs";
import { PastTrainingSessionsAttentionPanel } from "./past-training-sessions-attention-panel";

const session = createRunTrainingSession({
  title: "Easy run",
  date: "2026-08-31",
  targetDistanceMetres: 12000,
  targetDurationSeconds: 3360,
});

const athleteId = "33333333-3333-4333-8333-333333333333";

function stubFetch(fetchMock: (url: string, options?: RequestInit) => unknown) {
  vi.stubGlobal("fetch", (url: string, options?: RequestInit) =>
    url === "/api/v1/me"
      ? Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue(
            createUser({
              id: athleteId,
            }),
          ),
        })
      : options === undefined
        ? fetchMock(url)
        : fetchMock(url, options),
  );
}

function renderPanel(className?: string) {
  const store = createTrainingSessionDialogsStore();
  render(
    <TrainingSessionDialogsStoreProvider store={store}>
      <QueryProvider>
        <PastTrainingSessionsAttentionPanel className={className} />
      </QueryProvider>
    </TrainingSessionDialogsStoreProvider>,
  );
  return store;
}

test("renders a compact attention panel and fetches past scheduled training sessions", async () => {
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

  const heading = await screen.findByText(
    "2 training sessions need your attention.",
  );
  expect(heading).toBeDefined();
  expect(
    screen.getByLabelText("Training sessions requiring attention").classList,
  ).toContain("mb-8");
  expect(
    screen.getByText("Past training sessions are waiting to be completed."),
  ).toBeDefined();
  expect(fetchMock).toHaveBeenCalledWith(
    `/api/v1/athletes/${athleteId}/training-sessions?to=${format(subDays(new Date(), 1), "yyyy-MM-dd")}&status=SCHEDULED`,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Review training sessions" }),
  );
  expect(store.getState().activeModal).toEqual({ kind: "review" });
});

test("does not render when no training session needs attention", async () => {
  stubFetch(
    vi
      .fn()
      .mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue([]) }),
  );
  renderPanel();

  await waitFor(() =>
    expect(
      screen.queryByLabelText("Training sessions requiring attention"),
    ).toBeNull(),
  );
});

test("uses singular grammar for one training session", async () => {
  stubFetch(
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([session]),
    }),
  );
  renderPanel();

  expect(
    await screen.findByText("1 training session needs your attention."),
  ).toBeDefined();
});
