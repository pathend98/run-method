import { fireEvent, render, screen, within } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import { TrainingPlannerStoreProvider } from "@/ui/training-planner/training-planner-store";
import { TrainingPlannerView } from "./training-planner-view";
import type {
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";

const activity = {
  id: "activity",
  title: "Tempo run",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  activityType: "RUN",
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1800,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
  day: "Monday",
} satisfies TrainingActivity;

const week: TrainingDay[] = [
  { day: "Monday", date: "2026-08-17", activities: [activity] },
  { day: "Tuesday", date: "2026-08-18", activities: [] },
  { day: "Wednesday", date: "2026-08-19", activities: [] },
  { day: "Thursday", date: "2026-08-20", activities: [] },
  { day: "Friday", date: "2026-08-21", activities: [] },
  { day: "Saturday", date: "2026-08-22", activities: [] },
  { day: "Sunday", date: "2026-08-23", activities: [] },
];

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue([]) }),
  );
});

function renderView(
  overrides: Partial<React.ComponentProps<typeof TrainingPlannerView>> = {},
) {
  const onAddActivity = vi.fn();
  const onSelectActivity = vi.fn();
  render(
    <TrainingPlannerStoreProvider>
      <QueryProvider>
        <TrainingPlannerView
          isCurrentWeek
          onAddActivity={onAddActivity}
          onCurrentWeek={vi.fn()}
          onNextWeek={vi.fn()}
          onPreviousWeek={vi.fn()}
          onSelectActivity={onSelectActivity}
          sessions={week.flatMap((day) => day.activities)}
          week={week}
          weekRange={{ from: "2026-08-17", to: "2026-08-23" }}
          {...overrides}
        />
      </QueryProvider>
    </TrainingPlannerStoreProvider>,
  );
  return { onAddActivity, onSelectActivity };
}

test("renders the weekly grid without modal UI", () => {
  renderView();
  expect(
    screen.getByRole("heading", { level: 1, name: "Training Plan" }),
  ).toBeDefined();
  const navigation = screen.getByRole("navigation", {
    name: "Week navigation",
  });
  expect(navigation.classList.contains("mb-6")).toBe(true);
  expect(within(navigation).getByText("17 Aug – 23 Aug")).toBeDefined();
  const summary = screen.getByRole("region", { name: "Weekly summary" });
  expect(summary).toBeDefined();
  expect(summary.parentElement?.classList.contains("mb-8")).toBe(true);
  expect(
    navigation.compareDocumentPosition(summary) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).not.toBe(0);
  expect(screen.getByText("Running distance")).toBeDefined();
  expect(screen.getByText(/5\.0 km (scheduled|planned)/)).toBeDefined();
  expect(screen.queryByRole("button", { name: "Today" })).toBeNull();
  expect(screen.queryByText("Weekly schedule")).toBeNull();
  expect(
    screen.queryByText(
      "A simple week view for arranging runs, workouts, recovery, and rest across morning, flexible, and evening slots.",
    ),
  ).toBeNull();
  const planner = screen.getByRole("list", { name: "Weekly training planner" });
  expect(within(planner).getAllByRole("listitem")).toHaveLength(8);
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("forwards activity and add selections through its private grid", () => {
  const { onAddActivity, onSelectActivity } = renderView();
  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Add activity to Monday" }),
  );
  expect(onSelectActivity).toHaveBeenCalledWith(activity);
  expect(onAddActivity).toHaveBeenCalledWith(week[0]);
});

test("forwards week navigation callbacks", () => {
  const onPreviousWeek = vi.fn();
  const onNextWeek = vi.fn();
  renderView({ onPreviousWeek, onNextWeek });
  fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
  fireEvent.click(screen.getByRole("button", { name: "Next week" }));
  expect(onPreviousWeek).toHaveBeenCalledOnce();
  expect(onNextWeek).toHaveBeenCalledOnce();
});

test("shows Today for a non-current week", () => {
  const onCurrentWeek = vi.fn();
  renderView({ isCurrentWeek: false, onCurrentWeek });

  fireEvent.click(screen.getByRole("button", { name: "Today" }));

  expect(onCurrentWeek).toHaveBeenCalledOnce();
});
