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
          onDragStart({ operation: { source: { id: "activity" } } })
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
        aria-label="Drop activity on Tuesday evening"
        onClick={() =>
          onDragEnd({
            canceled: false,
            operation: {
              source: { data: { activity } },
              target: { data: { date: "2026-08-18", timeOfDay: "PM" } },
            },
          })
        }
        type="button"
      />
      <button
        aria-label="Drop activity outside a zone"
        onClick={() =>
          onDragEnd({
            canceled: false,
            operation: { source: { data: { activity } }, target: null },
          })
        }
        type="button"
      />
      <button
        aria-label="Drop activity in its current slot"
        onClick={() =>
          onDragEnd({
            canceled: false,
            operation: {
              source: { data: { activity } },
              target: { data: { date: activity.date, timeOfDay: "AM" } },
            },
          })
        }
        type="button"
      />
      <button
        aria-label="Drop completed activity on Tuesday evening"
        onClick={() =>
          onDragEnd({
            canceled: false,
            operation: {
              source: {
                data: { activity: { ...activity, status: "COMPLETED" } },
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
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";

const activity = {
  id: "activity",
  title: "Tempo run",
  activityType: "RUN",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1530,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
  day: "Monday",
} satisfies TrainingActivity;

const week = [
  { day: "Monday", date: "2026-08-17", activities: [activity] },
  { day: "Tuesday", date: "2026-08-18", activities: [] },
] satisfies TrainingDay[];

afterEach(() => {
  vi.useRealTimers();
});

test("renders a labelled weekly planner list with day columns", () => {
  render(<WeekGrid onSelectActivity={vi.fn()} week={week} />);

  const planner = screen.getByRole("list", { name: "Weekly training planner" });
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

test("passes activity selection through from day columns", () => {
  const onSelectActivity = vi.fn();

  render(<WeekGrid onSelectActivity={onSelectActivity} week={week} />);
  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );

  expect(onSelectActivity).toHaveBeenCalledWith(activity);
});

test("moves a scheduled activity to a different drop zone", () => {
  const onMoveActivity = vi.fn().mockResolvedValue(undefined);

  render(
    <WeekGrid
      onMoveActivity={onMoveActivity}
      onSelectActivity={vi.fn()}
      week={week}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Drop activity on Tuesday evening" }),
  );

  expect(onMoveActivity).toHaveBeenCalledWith(activity, {
    date: "2026-08-18",
    timeOfDay: "PM",
  });
});

test("does not move cancelled, outside, unchanged, or non-scheduled drops", () => {
  const onMoveActivity = vi.fn().mockResolvedValue(undefined);

  render(
    <WeekGrid
      onMoveActivity={onMoveActivity}
      onSelectActivity={vi.fn()}
      week={week}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "End drag" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Drop activity outside a zone" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Drop activity in its current slot" }),
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Drop completed activity on Tuesday evening",
    }),
  );

  expect(onMoveActivity).not.toHaveBeenCalled();
});

test("silently ignores a failed activity move", async () => {
  const onMoveActivity = vi.fn().mockRejectedValue(new Error("nope"));

  render(
    <WeekGrid
      onMoveActivity={onMoveActivity}
      onSelectActivity={vi.fn()}
      week={week}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Drop activity on Tuesday evening" }),
  );

  await waitFor(() => expect(onMoveActivity).toHaveBeenCalledOnce());
});

test("shows dashed morning, evening, and anytime zones during a mouse drag", () => {
  render(<WeekGrid onSelectActivity={vi.fn()} week={week} />);

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
  expect(screen.getAllByText("Tempo run")).toHaveLength(2);
  expect(planner.firstElementChild?.className).toContain("divide-x-0");

  fireEvent.click(screen.getByRole("button", { name: "End drag" }));

  expect(screen.getByText("Rest day")).toBeDefined();
  expect(planner.firstElementChild?.className).toContain("divide-x");
});

test("configures a mouse-only sensor with an eight-pixel activation distance", () => {
  render(<WeekGrid onSelectActivity={vi.fn()} week={week} />);

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

  render(<WeekGrid onSelectActivity={vi.fn()} week={week} />);

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

  render(<WeekGrid onSelectActivity={vi.fn()} week={week} />);

  expect(document.querySelector('time[aria-current="date"]')).toBeNull();
  expect(document.querySelector('[class~="bg-teal-100/60"]')).toBeNull();
});
