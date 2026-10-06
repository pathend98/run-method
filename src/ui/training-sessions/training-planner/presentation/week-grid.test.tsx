import { createRunTrainingSession } from "@/test-support/fixtures/training-session";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

const dndMocks = vi.hoisted(() => ({
  configure: vi.fn(
    (sensorOptions: {
      activationConstraints: unknown[];
      preventActivation: (event: { pointerType: string }) => boolean;
    }) => {
      dndMocks.sensorOptions = sensorOptions;
      return {};
    },
  ),
  sensorOptions: undefined as
    | {
        activationConstraints: unknown[];
        preventActivation: (event: { pointerType: string }) => boolean;
      }
    | undefined,
}));

vi.mock("@dnd-kit/react", () => ({
  DragDropProvider: ({
    children,
    onDragEnd,
    onDragStart,
  }: {
    children: React.ReactNode;
    onDragEnd: (event: unknown) => void;
    onDragStart: (event: { operation: { source: { id: string } } }) => void;
  }) => (
    <div>
      <button
        aria-label="Start drag"
        onClick={() =>
          onDragStart({ operation: { source: { id: "training-session" } } })
        }
        type="button"
      />
      <button
        aria-label="End drag"
        onClick={() =>
          onDragEnd({
            canceled: true,
            operation: { source: null, target: null },
          })
        }
        type="button"
      />
      <button
        aria-label="Drop training session on Tuesday evening"
        onClick={() =>
          onDragEnd({
            canceled: false,
            operation: {
              source: { data: { trainingSession } },
              target: { data: { date: "2026-08-18", timeOfDay: "PM" } },
            },
          })
        }
        type="button"
      />
      <button
        aria-label="Drop training session outside a zone"
        onClick={() =>
          onDragEnd({
            canceled: false,
            operation: { source: { data: { trainingSession } }, target: null },
          })
        }
        type="button"
      />
      <button
        aria-label="Drop training session in its current slot"
        onClick={() =>
          onDragEnd({
            canceled: false,
            operation: {
              source: { data: { trainingSession } },
              target: { data: { date: trainingSession.date, timeOfDay: "AM" } },
            },
          })
        }
        type="button"
      />
      <button
        aria-label="Drop completed training session on Tuesday evening"
        onClick={() =>
          onDragEnd({
            canceled: false,
            operation: {
              source: {
                data: {
                  trainingSession: { ...trainingSession, status: "COMPLETED" },
                },
              },
              target: { data: { date: "2026-08-18", timeOfDay: "PM" } },
            },
          })
        }
        type="button"
      />
      {children}
    </div>
  ),
  DragOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PointerSensor: { configure: dndMocks.configure },
  useDraggable: () => ({ isDragSource: false, ref: vi.fn() }),
  useDroppable: () => ({ isDropTarget: false, ref: vi.fn() }),
}));
import { WeekGrid } from "./week-grid";
import type {
  PlannerTrainingSession,
  TrainingDay,
} from "../calendar/training-calendar-types";

const trainingSession = {
  ...createRunTrainingSession({
    id: "training-session",
    targetDistanceMetres: 6000,
    targetDurationSeconds: 1530,
  }),
  day: "Monday",
} satisfies PlannerTrainingSession;

const week = [
  { day: "Monday", date: "2026-08-17", trainingSessions: [trainingSession] },
  { day: "Tuesday", date: "2026-08-18", trainingSessions: [] },
] satisfies TrainingDay[];

afterEach(() => {
  vi.useRealTimers();
});

test("renders a labelled weekly planner list with day columns", () => {
  render(<WeekGrid onSelectTrainingSession={vi.fn()} week={week} />);

  const mobilePlanner = screen.getByRole("region", {
    name: "Mobile weekly training planner",
  });
  expect(mobilePlanner.className).toContain("min-[1155px]:hidden");
  const planner = screen.getByRole("list", { name: "Weekly training planner" });
  expect(planner.className).toContain("hidden");
  expect(planner.className).toContain("min-[1155px]:block");
  expect(planner.className).toContain("overflow-x-auto");
  expect(planner.className).toContain("rounded-lg");
  expect(planner.className).toContain("border");
  expect(planner.firstElementChild?.className).toContain("divide-x");
  expect(
    within(planner).getByRole("listitem", { name: "Monday" }),
  ).toBeDefined();
  expect(
    within(planner).getByRole("listitem", { name: "Tuesday" }),
  ).toBeDefined();
  expect(within(planner).getByText("Tempo run")).toBeDefined();
  expect(within(planner).getByText("Rest day")).toBeDefined();
});

test("supports a mobile week fixture without dates", () => {
  render(
    <WeekGrid
      onSelectTrainingSession={vi.fn()}
      week={[{ day: "Monday", trainingSessions: [] }]}
    />,
  );

  expect(screen.getByRole("tab", { name: "Monday" })).toBeDefined();
});

test("resets the mobile selection when the displayed week changes", () => {
  const { rerender } = render(
    <WeekGrid onSelectTrainingSession={vi.fn()} week={week} />,
  );
  fireEvent.click(screen.getByRole("tab", { name: "Tuesday 18 August" }));

  rerender(
    <WeekGrid
      onSelectTrainingSession={vi.fn()}
      week={[
        { day: "Monday", date: "2026-08-24", trainingSessions: [] },
        { day: "Tuesday", date: "2026-08-25", trainingSessions: [] },
      ]}
    />,
  );

  expect(
    screen
      .getByRole("tab", { name: "Monday 24 August" })
      .getAttribute("aria-selected"),
  ).toBe("true");
});

test("passes training session selection through from day columns", () => {
  const onSelectTrainingSession = vi.fn();

  render(
    <WeekGrid onSelectTrainingSession={onSelectTrainingSession} week={week} />,
  );
  fireEvent.click(
    within(
      screen.getByRole("list", { name: "Weekly training planner" }),
    ).getByRole("button", { name: "View Tempo run details" }),
  );

  expect(onSelectTrainingSession).toHaveBeenCalledWith(trainingSession);
});

test("moves a scheduled training session to a different drop zone", () => {
  const onMoveTrainingSession = vi.fn().mockResolvedValue(undefined);

  render(
    <WeekGrid
      onMoveTrainingSession={onMoveTrainingSession}
      onSelectTrainingSession={vi.fn()}
      week={week}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Drop training session on Tuesday evening",
    }),
  );

  expect(onMoveTrainingSession).toHaveBeenCalledWith(trainingSession, {
    date: "2026-08-18",
    timeOfDay: "PM",
  });
});

test("does not move cancelled, outside, unchanged, or non-scheduled drops", () => {
  const onMoveTrainingSession = vi.fn().mockResolvedValue(undefined);

  render(
    <WeekGrid
      onMoveTrainingSession={onMoveTrainingSession}
      onSelectTrainingSession={vi.fn()}
      week={week}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "End drag" }));
  fireEvent.click(
    screen.getByRole("button", {
      name: "Drop training session outside a zone",
    }),
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Drop training session in its current slot",
    }),
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Drop completed training session on Tuesday evening",
    }),
  );

  expect(onMoveTrainingSession).not.toHaveBeenCalled();
});

test("silently ignores a failed training session move", async () => {
  const onMoveTrainingSession = vi.fn().mockRejectedValue(new Error("nope"));

  render(
    <WeekGrid
      onMoveTrainingSession={onMoveTrainingSession}
      onSelectTrainingSession={vi.fn()}
      week={week}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Drop training session on Tuesday evening",
    }),
  );

  await waitFor(() => expect(onMoveTrainingSession).toHaveBeenCalledOnce());
});

test("shows dashed morning, evening, and anytime zones during a mouse drag", () => {
  render(<WeekGrid onSelectTrainingSession={vi.fn()} week={week} />);

  fireEvent.click(screen.getByRole("button", { name: "Start drag" }));

  const planner = screen.getByRole("list", { name: "Weekly training planner" });
  const monday = screen.getByRole("listitem", { name: "Monday" });
  const tuesday = screen.getByRole("listitem", { name: "Tuesday" });
  expect(
    within(monday)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent),
  ).toEqual(["Morning", "Evening", "Anytime"]);
  expect(
    within(tuesday)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent),
  ).toEqual(["Morning", "Evening", "Anytime"]);
  expect(screen.queryByText("Rest day")).toBeNull();
  expect(screen.getAllByText("Tempo run")).toHaveLength(3);
  expect(planner.firstElementChild?.className).toContain("divide-x-0");

  fireEvent.click(screen.getByRole("button", { name: "End drag" }));

  expect(screen.getByText("Rest day")).toBeDefined();
  expect(planner.firstElementChild?.className).toContain("divide-x");
});

test("configures a mouse-only sensor with an eight-pixel activation distance", () => {
  render(<WeekGrid onSelectTrainingSession={vi.fn()} week={week} />);

  const sensorOptions = dndMocks.sensorOptions;

  if (!sensorOptions)
    throw new Error("Expected the pointer sensor to configure");

  expect(sensorOptions.preventActivation({ pointerType: "mouse" })).toBe(false);
  expect(sensorOptions.preventActivation({ pointerType: "touch" })).toBe(true);
  expect(sensorOptions.preventActivation({ pointerType: "pen" })).toBe(true);
});

test("tints only today's column when the displayed week includes it", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-17T12:00:00"));

  render(<WeekGrid onSelectTrainingSession={vi.fn()} week={week} />);

  const monday = screen.getByRole("listitem", { name: "Monday" });
  const tuesday = screen.getByRole("listitem", { name: "Tuesday" });
  const today = monday.querySelector('time[aria-current="date"]');

  expect(monday.className).toContain("bg-teal-100/40");
  expect(today?.textContent).toBe("17 Aug");
  expect(today?.className).toContain("text-zinc-500");
  expect(today?.className).not.toContain("rounded-full");
  expect(tuesday.className).not.toContain("bg-teal-100/60");
  expect(tuesday.querySelector('time[aria-current="date"]')).toBeNull();
});

test("does not mark a date outside the displayed week as today", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-20T12:00:00"));

  render(<WeekGrid onSelectTrainingSession={vi.fn()} week={week} />);

  expect(document.querySelector('time[aria-current="date"]')).toBeNull();
  expect(document.querySelector('[class~="bg-teal-100/60"]')).toBeNull();
});
