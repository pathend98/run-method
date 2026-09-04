import { fireEvent, render, screen, within } from "@testing-library/react";
import { DayColumn } from "./day-column";
import type {
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";

const baseActivity = {
  id: "activity",
  title: "Tempo run",
  status: "SCHEDULED",
  date: "2026-08-17",
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  day: "Monday",
} satisfies Partial<TrainingActivity>;

function runActivity(
  override: Partial<TrainingActivity> = {},
): TrainingActivity {
  return {
    ...baseActivity,
    activityType: "RUN",
    timeOfDay: "AM",
    targetDistanceMetres: 8000,
    targetDurationSeconds: 2700,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
    ...override,
  } as TrainingActivity;
}

function strengthActivity(
  override: Partial<TrainingActivity> = {},
): TrainingActivity {
  return {
    ...baseActivity,
    id: "strength",
    title: "Strength",
    activityType: "STRENGTH",
    timeOfDay: "PM",
    targetDurationSeconds: 2700,
    actualDurationSeconds: null,
    ...override,
  } as TrainingActivity;
}

test("renders populated time buckets in day order", () => {
  render(
    <DayColumn
      day={{
        day: "Monday",
        date: "2026-08-17",
        activities: [
          runActivity({ id: "am", title: "Morning run", timeOfDay: "AM" }),
          strengthActivity({
            id: "any",
            title: "Mobility",
            timeOfDay: null,
          }),
          strengthActivity({ id: "pm", title: "Evening lift" }),
        ],
      }}
      onSelectActivity={vi.fn()}
    />,
  );

  const column = screen.getByRole("listitem", { name: "Monday" });
  expect(
    within(column).getByRole("heading", { level: 2, name: "Monday" }),
  ).toBeDefined();
  expect(within(column).getByText("Monday")).toBeDefined();
  expect(
    within(column)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent),
  ).toEqual(["Morning", "Anytime", "Evening"]);
  expect(within(column).getByText("Morning run")).toBeDefined();
  expect(within(column).getByText("Mobility")).toBeDefined();
  expect(within(column).getByText("Evening lift")).toBeDefined();
  expect(within(column).getByText("17 Aug").getAttribute("datetime")).toBe(
    "2026-08-17",
  );
});

test("renders an empty state for days without activities", () => {
  render(
    <DayColumn
      day={{ day: "Tuesday", activities: [] }}
      onSelectActivity={vi.fn()}
    />,
  );

  expect(screen.getByRole("listitem", { name: "Tuesday" })).toBeDefined();
  expect(screen.getByText("No activity scheduled")).toBeDefined();
  expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
});

test("passes the selected activity to the select handler", () => {
  const onSelectActivity = vi.fn();
  const selectedActivity = runActivity({ title: "Morning run" });
  const day = {
    day: "Monday",
    activities: [selectedActivity],
  } satisfies TrainingDay;

  render(<DayColumn day={day} onSelectActivity={onSelectActivity} />);
  fireEvent.click(
    screen.getByRole("button", { name: "View Morning run details" }),
  );

  expect(onSelectActivity).toHaveBeenCalledWith(selectedActivity);
});

test("adds the today accent to its activity cards", () => {
  render(
    <DayColumn
      day={{
        day: "Monday",
        date: "2026-08-17",
        activities: [runActivity()],
      }}
      isToday
      onSelectActivity={vi.fn()}
    />,
  );

  const card = screen.getByRole("button", { name: "View Tempo run details" });
  expect(card.className).toContain("border-teal-300");
  expect(card.className).not.toContain("ring-");
});

test("passes its day to the add handler", () => {
  const onAddActivity = vi.fn();
  const day = { day: "Monday" as const, date: "2026-08-17", activities: [] };
  render(
    <DayColumn
      day={day}
      onAddActivity={onAddActivity}
      onSelectActivity={vi.fn()}
    />,
  );

  const addActivity = screen.getByRole("button", {
    name: "Add activity to Monday",
  });
  expect(addActivity.textContent).toBe("+ Add");
  expect(addActivity.className).toContain("[@media(hover:hover)]:opacity-0");
  expect(addActivity.className).toContain(
    "[@media(hover:hover)]:group-hover:opacity-100",
  );
  expect(addActivity.className).toContain(
    "[@media(hover:hover)]:group-focus-within:opacity-100",
  );
  expect(addActivity.className).not.toContain("lg:");
  expect(addActivity.className).not.toContain("border");
  expect(addActivity.className).not.toMatch(/(^|\s)bg-/);

  fireEvent.click(addActivity);
  expect(onAddActivity).toHaveBeenCalledWith(day);
});

test("allows an omitted add handler", () => {
  render(
    <DayColumn
      day={{ day: "Monday", activities: [] }}
      onSelectActivity={vi.fn()}
    />,
  );

  expect(() =>
    fireEvent.click(
      screen.getByRole("button", { name: "Add activity to Monday" }),
    ),
  ).not.toThrow();
});
