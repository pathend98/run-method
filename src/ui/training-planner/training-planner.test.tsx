import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import { TrainingPlanner } from "./training-planner";

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
          date: "2026-08-17",
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
