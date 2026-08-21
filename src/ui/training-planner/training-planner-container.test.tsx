import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import {
  getCurrentWeekRange,
  groupSessionsByWeekday,
  TrainingPlannerContainer,
} from "./training-planner-container";

test("getCurrentWeekRange returns browser-local Monday through Sunday", () => {
  expect(getCurrentWeekRange(new Date("2026-08-21T12:00:00"))).toEqual({
    from: "2026-08-17",
    to: "2026-08-23",
  });
});

test("groupSessionsByWeekday groups API sessions into planner days", () => {
  const week = groupSessionsByWeekday([
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Long run",
      activityType: "Run",
      date: "2026-08-22",
      timeOfDay: "AM",
      description: "90 minutes",
      sortOrder: 0,
    },
  ]);

  expect(week).toHaveLength(7);
  expect(week[5]).toMatchObject({
    day: "Saturday",
    activities: [{ title: "Long run" }],
  });
});

test("TrainingPlannerContainer renders loading state", () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => undefined)),
  );

  render(
    <QueryProvider>
      <TrainingPlannerContainer />
    </QueryProvider>,
  );

  expect(screen.getByText("Loading training planner...")).toBeDefined();
});

test("TrainingPlannerContainer renders loaded planner data", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: "11111111-1111-4111-8111-111111111111",
          title: "Easy run",
          activityType: "Run",
          date: "2026-08-17",
          timeOfDay: "AM",
          description: null,
          sortOrder: 0,
        },
      ]),
    }),
  );

  render(
    <QueryProvider>
      <TrainingPlannerContainer />
    </QueryProvider>,
  );

  await waitFor(() => expect(screen.getByText("Easy run")).toBeDefined());
  expect(
    screen.getByRole("list", { name: "Weekly training planner" }),
  ).toBeDefined();
});

test("TrainingPlannerContainer renders error state", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ message: "Nope" }),
    }),
  );

  render(
    <QueryProvider>
      <TrainingPlannerContainer />
    </QueryProvider>,
  );

  await waitFor(() =>
    expect(screen.getByText("Unable to load training planner.")).toBeDefined(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
});
