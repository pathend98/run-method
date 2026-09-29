import { fireEvent, render, screen } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import { createUser } from "@/test-support/fixtures/user";
import { TrainingPlannerStoreProvider } from "./training-planner-store";
import { TrainingPlanner } from "./training-planner";

const athleteId = "33333333-3333-4333-8333-333333333333";

vi.mock("next/navigation", () => ({
  usePathname: () => "/training-planner",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function renderPlanner() {
  render(
    <QueryProvider>
      <TrainingPlannerStoreProvider>
        <TrainingPlanner />
      </TrainingPlannerStoreProvider>
    </QueryProvider>,
  );
}

test("waits for the user ID before fetching sessions", async () => {
  const userResponse = Promise.withResolvers<object>();
  const fetchMock = vi.fn().mockImplementation((url: string) =>
    url === "/api/v1/me"
      ? userResponse.promise
      : Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue([]),
        }),
  );
  vi.stubGlobal("fetch", fetchMock);

  renderPlanner();

  expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/v1/me", {
    cache: "no-store",
  });
  userResponse.resolve({
    ok: true,
    json: vi.fn().mockResolvedValue(
      createUser({
        id: athleteId,
      }),
    ),
  });
  await screen.findByRole("list", { name: "Weekly training planner" });
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining(`/api/v1/athletes/${athleteId}/training-sessions`),
  );
});

test("retries a failed current-user lookup", async () => {
  let userRequests = 0;
  const fetchMock = vi.fn().mockImplementation((url: string) => {
    if (url === "/api/v1/me") {
      userRequests += 1;
      return Promise.resolve({
        ok: userRequests > 1,
        status: userRequests > 1 ? 200 : 500,
        json: vi
          .fn()
          .mockResolvedValue(
            userRequests > 1
              ? createUser({ id: athleteId })
              : { error: "Lookup failed" },
          ),
      });
    }
    return Promise.resolve({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    });
  });
  vi.stubGlobal("fetch", fetchMock);

  renderPlanner();

  fireEvent.click(await screen.findByRole("button", { name: "Retry" }));
  await screen.findByRole("list", { name: "Weekly training planner" });
  expect(userRequests).toBe(2);
});
