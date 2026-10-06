import { createRunTrainingSession } from "@/test-support/fixtures/training-session";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { QueryProvider } from "@/app/query-provider";
import { TrainingSessionDialogsStoreProvider } from "@/ui/training-sessions/training-session-dialogs";
import { TrainingPlannerView } from "./training-planner-view";
import type {
  PlannerTrainingSession,
  TrainingDay,
} from "../calendar/training-calendar-types";

const trainingSession = {
  ...createRunTrainingSession({
    id: "training-session",
    targetDistanceMetres: 5000,
    targetDurationSeconds: 1800,
  }),
  day: "Monday",
} satisfies PlannerTrainingSession;

const week: TrainingDay[] = [
  { day: "Monday", date: "2026-08-17", trainingSessions: [trainingSession] },
  { day: "Tuesday", date: "2026-08-18", trainingSessions: [] },
  { day: "Wednesday", date: "2026-08-19", trainingSessions: [] },
  { day: "Thursday", date: "2026-08-20", trainingSessions: [] },
  { day: "Friday", date: "2026-08-21", trainingSessions: [] },
  { day: "Saturday", date: "2026-08-22", trainingSessions: [] },
  { day: "Sunday", date: "2026-08-23", trainingSessions: [] },
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
  const onAddTrainingSession = vi.fn();
  const onSelectTrainingSession = vi.fn();
  render(
    <TrainingSessionDialogsStoreProvider>
      <QueryProvider>
        <TrainingPlannerView
          isCurrentWeek
          onAddTrainingSession={onAddTrainingSession}
          onCurrentWeek={vi.fn()}
          onMoveTrainingSession={vi.fn().mockResolvedValue(undefined)}
          onNextWeek={vi.fn()}
          onPreviousWeek={vi.fn()}
          onSelectTrainingSession={onSelectTrainingSession}
          sessions={week.flatMap((day) => day.trainingSessions)}
          week={week}
          weekRange={{ from: "2026-08-17", to: "2026-08-23" }}
          {...overrides}
        />
      </QueryProvider>
    </TrainingSessionDialogsStoreProvider>,
  );
  return { onAddTrainingSession, onSelectTrainingSession };
}

test("renders the weekly grid without modal UI", () => {
  renderView();
  const heading = screen.getByRole("heading", {
    level: 1,
    name: "Training Plan",
  });
  expect(heading.classList).not.toContain("text-center");
  expect(heading.classList).toContain("text-2xl");
  expect(heading.classList).toContain("sm:text-4xl");
  expect(heading.parentElement?.tagName).toBe("SECTION");
  const navigation = screen.getByRole("navigation", {
    name: "Week navigation",
  });
  expect(navigation.classList.contains("mb-6")).toBe(true);
  expect(navigation.classList).toContain("w-full");
  expect(navigation.classList).toContain(
    "grid-cols-[2.25rem_minmax(0,1fr)_2.25rem_auto]",
  );
  expect(navigation.classList).toContain("sm:flex");
  expect(within(navigation).getByText("17 Aug – 23 Aug")).toBeDefined();
  const summary = screen.getByRole("region", { name: "Weekly summary" });
  expect(summary).toBeDefined();
  expect(summary.classList).toContain("mb-8");
  expect(summary.nextElementSibling).toBe(
    screen.getByRole("region", { name: "Mobile weekly training planner" }),
  );
  expect(
    navigation.compareDocumentPosition(summary) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).not.toBe(0);
  expect(screen.getByText("Running distance")).toBeDefined();
  expect(screen.getByText(/5\.00 km (scheduled|planned)/)).toBeDefined();
  const today = screen.getByRole("button", { name: "Today" });
  expect(today).toHaveProperty("disabled", true);
  expect(today.classList).toContain("sm:hidden");
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

test("forwards training session selections and add actions through its private grid", () => {
  const { onAddTrainingSession, onSelectTrainingSession } = renderView();
  const mobilePlanner = screen.getByRole("region", {
    name: "Mobile weekly training planner",
  });
  fireEvent.click(
    within(mobilePlanner).getByRole("button", {
      name: "View Tempo run details",
    }),
  );
  fireEvent.click(
    within(mobilePlanner).getByRole("button", {
      name: "Add training session to Monday",
    }),
  );
  expect(onSelectTrainingSession).toHaveBeenCalledWith(trainingSession);
  expect(onAddTrainingSession).toHaveBeenCalledWith(week[0]);
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

  const today = screen.getByRole("button", { name: "Today" });
  expect(today).toHaveProperty("disabled", false);
  expect(today.classList).not.toContain("sm:hidden");
  fireEvent.click(today);

  expect(onCurrentWeek).toHaveBeenCalledOnce();
});
