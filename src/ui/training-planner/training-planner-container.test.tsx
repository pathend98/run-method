import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import { TrainingPlannerContainer } from "./training-planner-container";

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
      json: vi.fn().mockResolvedValue({ error: "Nope" }),
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
