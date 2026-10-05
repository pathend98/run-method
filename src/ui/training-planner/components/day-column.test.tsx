import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  createRunTrainingSession,
  createStrengthTrainingSession,
} from "@/test-support/fixtures/training-session";
import { DayColumn } from "./day-column";
import type {
  PlannerTrainingSession,
  TrainingDay,
} from "../types/training-planner-types";

function runTrainingSession(
  override: Partial<PlannerTrainingSession> = {},
): PlannerTrainingSession {
  return {
    ...createRunTrainingSession({ id: "training-session" }),
    day: "Monday",
    ...override,
  } as PlannerTrainingSession;
}

function strengthTrainingSession(
  override: Partial<PlannerTrainingSession> = {},
): PlannerTrainingSession {
  return {
    ...createStrengthTrainingSession({ id: "strength", timeOfDay: "PM" }),
    day: "Monday",
    ...override,
  } as PlannerTrainingSession;
}

test("renders populated time buckets in day order", () => {
  render(
    <DayColumn
      day={{
        day: "Monday",
        date: "2026-08-17",
        trainingSessions: [
          runTrainingSession({
            id: "am",
            title: "Morning run",
            timeOfDay: "AM",
          }),
          strengthTrainingSession({
            id: "any",
            title: "Mobility",
            timeOfDay: null,
          }),
          strengthTrainingSession({ id: "pm", title: "Evening lift" }),
        ],
      }}
      onSelectTrainingSession={vi.fn()}
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
  ).toEqual(["Morning", "Evening", "Anytime"]);
  expect(within(column).getByText("Morning run")).toBeDefined();
  expect(within(column).getByText("Mobility")).toBeDefined();
  expect(within(column).getByText("Evening lift")).toBeDefined();
  expect(within(column).getByText("17 Aug").getAttribute("datetime")).toBe(
    "2026-08-17",
  );
});

test("renders an empty state for days without training sessions", () => {
  render(
    <DayColumn
      day={{ day: "Tuesday", trainingSessions: [] }}
      onSelectTrainingSession={vi.fn()}
    />,
  );

  expect(screen.getByRole("listitem", { name: "Tuesday" })).toBeDefined();
  expect(screen.getByText("Rest day")).toBeDefined();
  expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
});

test("makes drag drop zones continuous and full-width within a day column", () => {
  render(
    <DayColumn
      day={{ day: "Monday", trainingSessions: [runTrainingSession()] }}
      isDragActive
      isDragAndDropEnabled
      onSelectTrainingSession={vi.fn()}
    />,
  );

  const column = screen.getByRole("listitem", { name: "Monday" });
  const zones = column.querySelector("header + div");

  expect(zones).not.toBeNull();
  expect(zones?.className).toContain("gap-0");
  expect(zones?.className).toContain("-mx-3");
  expect(zones?.className).toContain("pt-5");
});

test("passes the selected training session to the select handler", () => {
  const onSelectTrainingSession = vi.fn();
  const selectedTrainingSession = runTrainingSession({ title: "Morning run" });
  const day = {
    day: "Monday",
    trainingSessions: [selectedTrainingSession],
  } satisfies TrainingDay;

  render(
    <DayColumn day={day} onSelectTrainingSession={onSelectTrainingSession} />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "View Morning run details" }),
  );

  expect(onSelectTrainingSession).toHaveBeenCalledWith(selectedTrainingSession);
});

test("adds a soft today tint while retaining the standard training session card border", () => {
  render(
    <DayColumn
      day={{
        day: "Monday",
        date: "2026-08-17",
        trainingSessions: [runTrainingSession()],
      }}
      isToday
      onSelectTrainingSession={vi.fn()}
    />,
  );

  const column = screen.getByRole("listitem", { name: "Monday" });
  expect(column.className).toContain("bg-teal-100/40");

  const card = screen.getByRole("button", { name: "View Tempo run details" });
  expect(card.className).toContain("border-zinc-200");
  expect(card.className).not.toContain("border-teal-300");
  expect(card.className).not.toContain("ring-");
});

test("passes its day to the add handler", () => {
  const onAddTrainingSession = vi.fn();
  const day = {
    day: "Monday" as const,
    date: "2026-08-17",
    trainingSessions: [],
  };
  render(
    <DayColumn
      day={day}
      onAddTrainingSession={onAddTrainingSession}
      onSelectTrainingSession={vi.fn()}
    />,
  );

  const addTrainingSession = screen.getByRole("button", {
    name: "Add training session to Monday",
  });
  expect(addTrainingSession.textContent).toBe("+ Add");
  expect(addTrainingSession.className).toContain(
    "[@media(hover:hover)]:opacity-0",
  );
  expect(addTrainingSession.className).toContain(
    "[@media(hover:hover)]:group-hover:opacity-100",
  );
  expect(addTrainingSession.className).toContain(
    "[@media(hover:hover)]:group-focus-within:opacity-100",
  );
  expect(addTrainingSession.className).not.toContain("lg:");
  expect(addTrainingSession.className).not.toContain("border");
  expect(addTrainingSession.className).not.toMatch(/(^|\s)bg-/);

  fireEvent.click(addTrainingSession);
  expect(onAddTrainingSession).toHaveBeenCalledWith(day);
});

test("allows an omitted add handler", () => {
  render(
    <DayColumn
      day={{ day: "Monday", trainingSessions: [] }}
      onSelectTrainingSession={vi.fn()}
    />,
  );

  expect(() =>
    fireEvent.click(
      screen.getByRole("button", { name: "Add training session to Monday" }),
    ),
  ).not.toThrow();
});
