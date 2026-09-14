import {
  fireEvent,
  render as testingRender,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { format, subDays } from "date-fns";

import { QueryProvider } from "@/app/query-provider";
import { TrainingPlannerStoreProvider } from "./training-planner-store";
import { TrainingPlanner } from "./training-planner";
import { getCurrentWeekRange } from "./services/training-planner-service";

const navigation = vi.hoisted(() => ({
  pathname: "/",
  push: vi.fn(),
  search: "",
}));

function render(ui: React.ReactElement) {
  const rendered = testingRender(
    <TrainingPlannerStoreProvider>{ui}</TrainingPlannerStoreProvider>,
  );

  return {
    ...rendered,
    rerender: (nextUi: React.ReactElement) =>
      rendered.rerender(
        <TrainingPlannerStoreProvider>{nextUi}</TrainingPlannerStoreProvider>,
      ),
  };
}

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

beforeEach(() => {
  navigation.pathname = "/";
  navigation.push.mockReset();
  navigation.search = "";
});

test("TrainingPlanner renders loading state", () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => undefined)),
  );

  render(
    <QueryProvider>
      <TrainingPlanner />
    </QueryProvider>,
  );

  expect(screen.getByText("Loading training planner...")).toBeDefined();
});

test("TrainingPlanner renders loaded planner data", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: "11111111-1111-4111-8111-111111111111",
          title: "Easy run",
          activityType: "RUN",
          status: "SCHEDULED",
          date: getCurrentWeekRange().from,
          timeOfDay: "AM",
          description: null,
          sortOrder: 0,
          skipReason: null,
          createdAt: "2026-08-01T10:00:00.000Z",
          updatedAt: "2026-08-01T10:00:00.000Z",
          targetDistanceMetres: 8000,
          targetDurationSeconds: 2700,
          actualDistanceMetres: null,
          actualDurationSeconds: null,
        },
      ]),
    }),
  );

  render(
    <QueryProvider>
      <TrainingPlanner />
    </QueryProvider>,
  );

  const planner = await screen.findByRole("list", {
    name: "Weekly training planner",
  });
  expect(within(planner).getByText("Easy run")).toBeDefined();
  fireEvent.click(
    within(planner).getByRole("button", { name: "View Easy run details" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Move" }));
  expect(screen.getByRole("dialog", { name: "Move Easy run" })).toBeDefined();
});

test("TrainingPlanner opens the activity review modal from the attention panel", async () => {
  const pastSession = {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Easy run",
    activityType: "RUN",
    status: "SCHEDULED",
    date: format(subDays(new Date(), 1), "yyyy-MM-dd"),
    timeOfDay: "AM",
    description: null,
    sortOrder: 0,
    skipReason: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    targetDistanceMetres: 8000,
    targetDurationSeconds: 2700,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
  };
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([pastSession]),
    }),
  );

  render(
    <QueryProvider>
      <TrainingPlanner />
    </QueryProvider>,
  );

  fireEvent.click(
    await screen.findByRole("button", { name: "Review activities" }),
  );
  expect(
    await screen.findByRole("dialog", { name: "Activities needing attention" }),
  ).toBeDefined();
});

test("TrainingPlanner renders error state", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ error: "Nope" }),
    }),
  );

  render(
    <QueryProvider>
      <TrainingPlanner />
    </QueryProvider>,
  );

  await waitFor(() =>
    expect(screen.getByText("Unable to load training planner.")).toBeDefined(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
});

test("TrainingPlanner skips and completes activities through the API", async () => {
  const session = {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Easy run",
    activityType: "RUN",
    status: "SCHEDULED",
    date: getCurrentWeekRange().from,
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
  };
  const fetchMock = vi.fn().mockImplementation((url) => {
    if (url.endsWith("/skip"))
      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue({
          ...session,
          status: "SKIPPED",
          skipReason: "Recovery",
        }),
      });
    if (url.endsWith("/complete"))
      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue({
          ...session,
          status: "COMPLETED",
          actualDistanceMetres: 5000,
          actualDurationSeconds: 1800,
        }),
      });
    return Promise.resolve({
      ok: true,
      json: vi.fn().mockResolvedValue([session]),
    });
  });
  vi.stubGlobal("fetch", fetchMock);

  const first = render(
    <QueryProvider>
      <TrainingPlanner />
    </QueryProvider>,
  );
  const firstPlanner = await screen.findByRole("list", {
    name: "Weekly training planner",
  });
  fireEvent.click(
    within(firstPlanner).getByRole("button", {
      name: "View Easy run details",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Skip" }));
  fireEvent.change(
    screen.getByLabelText("Why are you skipping this activity?"),
    {
      target: { value: "Recovery" },
    },
  );
  fireEvent.click(screen.getByRole("button", { name: "Skip activity" }));
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/skip"),
      expect.any(Object),
    ),
  );

  first.unmount();
  render(
    <QueryProvider>
      <TrainingPlanner />
    </QueryProvider>,
  );
  const secondPlanner = await screen.findByRole("list", {
    name: "Weekly training planner",
  });
  fireEvent.click(
    within(secondPlanner).getByRole("button", {
      name: "View Easy run details",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Complete" }));
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "30" },
  });
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "5" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Complete activity" }));
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/complete"),
      expect.any(Object),
    ),
  );
});

test("TrainingPlanner creates an activity and refreshes its week", async () => {
  const range = getCurrentWeekRange();
  const fetchMock = vi.fn().mockImplementation((_url, options) => {
    if (options?.method === "POST") {
      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: "11111111-1111-4111-8111-111111111111",
          title: "Easy run",
          activityType: "RUN",
          status: "SCHEDULED",
          date: range.from,
          timeOfDay: null,
          description: null,
          sortOrder: 0,
          skipReason: null,
          createdAt: "2026-08-01T10:00:00.000Z",
          updatedAt: "2026-08-01T10:00:00.000Z",
          targetDistanceMetres: 5000,
          targetDurationSeconds: 1800,
          actualDistanceMetres: null,
          actualDurationSeconds: null,
        }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    });
  });
  vi.stubGlobal("fetch", fetchMock);

  render(
    <QueryProvider>
      <TrainingPlanner />
    </QueryProvider>,
  );

  const planner = await screen.findByRole("list", {
    name: "Weekly training planner",
  });
  fireEvent.click(
    within(planner).getByRole("button", { name: "Add activity to Monday" }),
  );
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Easy run" },
  });
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "5" },
  });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "30" },
  });
  fireEvent.click(
    screen
      .getByRole("dialog", { name: "Add activity" })
      .querySelector('button[type="submit"]') as HTMLButtonElement,
  );

  await waitFor(() =>
    expect(
      fetchMock.mock.calls.filter(([, options]) => options?.method === "POST"),
    ).toHaveLength(1),
  );
  await waitFor(() =>
    expect(
      fetchMock.mock.calls.filter(([, options]) => !options?.method),
    ).toHaveLength(4),
  );
});

test("TrainingPlanner edits an activity and refreshes its week", async () => {
  const range = getCurrentWeekRange();
  const activity = {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Easy run",
    activityType: "RUN",
    status: "SCHEDULED",
    date: range.from,
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
  };
  const updatedActivity = {
    ...activity,
    title: "Updated easy run",
    updatedAt: "2026-08-31T10:00:00.000Z",
  };
  let hasBeenEdited = false;
  const fetchMock = vi.fn().mockImplementation((_url, options) => {
    if (options?.method === "PATCH") {
      hasBeenEdited = true;
      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue(updatedActivity),
      });
    }
    return Promise.resolve({
      ok: true,
      json: vi
        .fn()
        .mockResolvedValue([hasBeenEdited ? updatedActivity : activity]),
    });
  });
  vi.stubGlobal("fetch", fetchMock);

  render(
    <QueryProvider>
      <TrainingPlanner />
    </QueryProvider>,
  );
  const planner = await screen.findByRole("list", {
    name: "Weekly training planner",
  });
  await within(planner).findByText("Easy run");
  fireEvent.click(
    within(planner).getByRole("button", { name: "View Easy run details" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Updated easy run" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

  await waitFor(() =>
    expect(
      fetchMock.mock.calls.filter(([, options]) => options?.method === "PATCH"),
    ).toHaveLength(1),
  );
  expect(fetchMock).toHaveBeenCalledWith(
    `/api/v1/training-sessions/${activity.id}`,
    expect.objectContaining({ method: "PATCH" }),
  );
  await waitFor(() =>
    expect(
      fetchMock.mock.calls.filter(([, options]) => !options?.method),
    ).toHaveLength(4),
  );
  expect(
    await within(planner).findByRole("button", {
      name: "View Updated easy run details",
    }),
  ).toBeDefined();
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("TrainingPlanner deletes an activity and refreshes its week", async () => {
  const range = getCurrentWeekRange();
  const activity = {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Easy run",
    activityType: "RUN",
    status: "SCHEDULED",
    date: range.from,
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
  };
  let deleted = false;
  const fetchMock = vi.fn().mockImplementation((_url, options) => {
    if (options?.method === "DELETE") {
      deleted = true;
      return Promise.resolve({ ok: true, status: 204 });
    }
    return Promise.resolve({
      ok: true,
      json: vi.fn().mockResolvedValue(deleted ? [] : [activity]),
    });
  });
  vi.stubGlobal("fetch", fetchMock);

  render(
    <QueryProvider>
      <TrainingPlanner />
    </QueryProvider>,
  );
  const planner = await screen.findByRole("list", {
    name: "Weekly training planner",
  });
  await within(planner).findByText("Easy run");
  fireEvent.click(
    within(planner).getByRole("button", { name: "View Easy run details" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));

  await waitFor(() =>
    expect(
      fetchMock.mock.calls.filter(
        ([, options]) => options?.method === "DELETE",
      ),
    ).toHaveLength(1),
  );
  expect(fetchMock).toHaveBeenCalledWith(
    `/api/v1/training-sessions/${activity.id}`,
    { method: "DELETE" },
  );
  await waitFor(() =>
    expect(
      fetchMock.mock.calls.filter(([, options]) => !options?.method),
    ).toHaveLength(4),
  );
  expect(screen.queryByRole("dialog", { name: "Easy run" })).toBeNull();
  expect(screen.queryByText("Easy run")).toBeNull();
});

test("TrainingPlanner fetches the week containing the URL date", async () => {
  navigation.search = "week=2026-08-19";
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue([]),
  });
  vi.stubGlobal("fetch", fetchMock);

  render(
    <QueryProvider>
      <TrainingPlanner />
    </QueryProvider>,
  );

  await screen.findByRole("list", { name: "Weekly training planner" });
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/training-sessions?from=2026-08-17&to=2026-08-23",
  );
});

test("TrainingPlanner navigates to adjacent Mondays and preserves query parameters", async () => {
  navigation.search = "week=2000-01-05&view=compact";
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    }),
  );

  render(
    <QueryProvider>
      <TrainingPlanner />
    </QueryProvider>,
  );

  await screen.findByRole("list", { name: "Weekly training planner" });
  fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
  fireEvent.click(screen.getByRole("button", { name: "Next week" }));

  expect(navigation.push).toHaveBeenNthCalledWith(
    1,
    "/?week=1999-12-27&view=compact",
    { scroll: false },
  );
  expect(navigation.push).toHaveBeenNthCalledWith(
    2,
    "/?week=2000-01-10&view=compact",
    { scroll: false },
  );
});

test("TrainingPlanner removes only the week parameter for the current-week navigation", async () => {
  navigation.search = "week=2000-01-05&view=compact";
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    }),
  );
  const planner = (
    <QueryProvider>
      <TrainingPlanner />
    </QueryProvider>
  );
  const { rerender } = render(planner);

  await screen.findByRole("list", { name: "Weekly training planner" });
  fireEvent.click(screen.getByRole("button", { name: "Today" }));
  expect(navigation.push).toHaveBeenLastCalledWith("/?view=compact", {
    scroll: false,
  });

  navigation.search = "week=2000-01-05";
  rerender(
    <QueryProvider>
      <TrainingPlanner />
    </QueryProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Today" }));
  expect(navigation.push).toHaveBeenLastCalledWith("/", { scroll: false });
});
