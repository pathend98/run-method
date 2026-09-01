import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import { TrainingPlanner } from "./training-planner";
import { getCurrentWeekRange } from "./services/training-planner-service";

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
          targetType: "DISTANCE_DURATION",
          targetDistanceMetres: 8000,
          targetDurationSeconds: 2700,
          targetPaceSecondsPerKilometre: null,
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

  await waitFor(() => expect(screen.getByText("Easy run")).toBeDefined());
  expect(
    screen.getByRole("list", { name: "Weekly training planner" }),
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
          targetType: "DISTANCE_DURATION",
          targetDistanceMetres: 5000,
          targetDurationSeconds: 1800,
          targetPaceSecondsPerKilometre: null,
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

  await screen.findByRole("list", { name: "Weekly training planner" });
  fireEvent.click(screen.getAllByRole("button", { name: "Add activity" })[0]);
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
    ).toHaveLength(2),
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
    targetType: "DISTANCE_DURATION",
    targetDistanceMetres: 5000,
    targetDurationSeconds: 1800,
    targetPaceSecondsPerKilometre: null,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
  };
  const fetchMock = vi.fn().mockImplementation((_url, options) => {
    if (options?.method === "PATCH") {
      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue({
          ...activity,
          title: "Updated easy run",
          updatedAt: "2026-08-31T10:00:00.000Z",
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
    <QueryProvider>
      <TrainingPlanner />
    </QueryProvider>,
  );
  await screen.findByText("Easy run");
  fireEvent.click(
    screen.getByRole("button", { name: "View Easy run details" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit activity" }));
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
    ).toHaveLength(2),
  );
  expect(
    await screen.findByRole("dialog", { name: "Updated easy run" }),
  ).toBeDefined();
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
    targetType: "DISTANCE_DURATION",
    targetDistanceMetres: 5000,
    targetDurationSeconds: 1800,
    targetPaceSecondsPerKilometre: null,
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
  await screen.findByText("Easy run");
  fireEvent.click(
    screen.getByRole("button", { name: "View Easy run details" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Delete activity" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));

  await waitFor(() =>
    expect(
      fetchMock.mock.calls.filter(([, options]) => options?.method === "DELETE"),
    ).toHaveLength(1),
  );
  expect(fetchMock).toHaveBeenCalledWith(
    `/api/v1/training-sessions/${activity.id}`,
    { method: "DELETE" },
  );
  await waitFor(() =>
    expect(
      fetchMock.mock.calls.filter(([, options]) => !options?.method),
    ).toHaveLength(2),
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
  fireEvent.click(screen.getByRole("button", { name: "Current week" }));
  expect(navigation.push).toHaveBeenLastCalledWith("/?view=compact", {
    scroll: false,
  });

  navigation.search = "week=2000-01-05";
  rerender(
    <QueryProvider>
      <TrainingPlanner />
    </QueryProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Current week" }));
  expect(navigation.push).toHaveBeenLastCalledWith("/", { scroll: false });
});
