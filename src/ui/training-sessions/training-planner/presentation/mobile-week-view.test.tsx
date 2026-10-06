import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  createRunTrainingSession,
  createStrengthTrainingSession,
} from "@/test-support/fixtures/training-session";

import { MobileWeekView } from "./mobile-week-view";
import type {
  PlannerTrainingSession,
  TrainingDay,
} from "../calendar/training-calendar-types";

const baseTrainingSession = {
  ...createRunTrainingSession({
    date: "2026-08-19",
    id: "training-session",
    targetDistanceMetres: 6000,
    targetDurationSeconds: 1800,
    title: "Easy run",
  }),
  day: "Wednesday",
} satisfies PlannerTrainingSession;

function trainingSession(
  overrides: Partial<PlannerTrainingSession> = {},
): PlannerTrainingSession {
  return { ...baseTrainingSession, ...overrides } as PlannerTrainingSession;
}

function createWeek(): TrainingDay[] {
  return [
    { day: "Monday", date: "2026-08-17", trainingSessions: [] },
    { day: "Tuesday", date: "2026-08-18", trainingSessions: [] },
    {
      day: "Wednesday",
      date: "2026-08-19",
      trainingSessions: [
        trainingSession({ id: "morning", title: "Easy run" }),
        {
          ...createStrengthTrainingSession({
            id: "evening",
            date: "2026-08-19",
            timeOfDay: "PM",
          }),
          day: "Wednesday",
        },
        trainingSession({
          id: "anytime",
          timeOfDay: null,
          title: "Recovery run",
        }),
      ],
    },
    { day: "Thursday", date: "2026-08-20", trainingSessions: [] },
    { day: "Friday", date: "2026-08-21", trainingSessions: [] },
    { day: "Saturday", date: "2026-08-22", trainingSessions: [] },
    { day: "Sunday", date: "2026-08-23", trainingSessions: [] },
  ];
}

afterEach(() => {
  vi.useRealTimers();
});

test("defaults to today and renders its full-width agenda in time order", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-19T12:00:00"));

  render(
    <MobileWeekView onSelectTrainingSession={vi.fn()} week={createWeek()} />,
  );

  const picker = screen.getByRole("tablist", { name: "Choose training day" });
  const tabs = within(picker).getAllByRole("tab");
  expect(tabs).toHaveLength(7);
  expect(tabs.map((tab) => tab.textContent)).toEqual([
    "Mon17",
    "Tue18",
    "Wed19",
    "Thu20",
    "Fri21",
    "Sat22",
    "Sun23",
  ]);
  const selectedTab = screen.getByRole("tab", {
    name: "Wednesday 19 August",
  });
  expect(selectedTab.getAttribute("aria-selected")).toBe("true");
  expect(selectedTab.classList).toContain("border-teal-600");

  const panel = screen.getByRole("tabpanel");
  expect(panel.getAttribute("aria-labelledby")).toBe(selectedTab.id);
  expect(
    within(panel)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent),
  ).toEqual(["Morning", "Evening", "Anytime"]);
  expect(
    within(panel).getByRole("button", { name: "View Easy run details" })
      .classList,
  ).toContain("w-full");
  expect(screen.queryByText("Rest day")).toBeNull();
});

test("falls back to Monday and changes the selected agenda", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-30T12:00:00"));
  render(
    <MobileWeekView onSelectTrainingSession={vi.fn()} week={createWeek()} />,
  );

  expect(
    screen
      .getByRole("tab", { name: "Monday 17 August" })
      .getAttribute("aria-selected"),
  ).toBe("true");
  expect(screen.getByText("Rest day")).toBeDefined();

  fireEvent.click(screen.getByRole("tab", { name: "Wednesday 19 August" }));

  expect(
    screen
      .getByRole("tab", { name: "Wednesday 19 August" })
      .getAttribute("aria-selected"),
  ).toBe("true");
  expect(screen.getByText("Easy run")).toBeDefined();
  expect(screen.queryByText("Rest day")).toBeNull();
});

test("forwards training session details and the selected day add action", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-19T12:00:00"));
  const onAddTrainingSession = vi.fn();
  const onSelectTrainingSession = vi.fn();
  const week = createWeek();
  render(
    <MobileWeekView
      onAddTrainingSession={onAddTrainingSession}
      onSelectTrainingSession={onSelectTrainingSession}
      week={week}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "View Easy run details" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Add training session to Wednesday" }),
  );

  expect(onSelectTrainingSession).toHaveBeenCalledWith(
    week[2].trainingSessions[0],
  );
  expect(onAddTrainingSession).toHaveBeenCalledWith(week[2]);
  expect(screen.getByText("+ Add training session")).toBeDefined();
});

test("supports an omitted add handler and a day without a date", () => {
  render(
    <MobileWeekView
      onSelectTrainingSession={vi.fn()}
      week={[{ day: "Monday", trainingSessions: [] }]}
    />,
  );

  const tab = screen.getByRole("tab", { name: "Monday" });
  expect(tab.textContent).toBe("Mon");
  expect(() =>
    fireEvent.click(
      screen.getByRole("button", { name: "Add training session to Monday" }),
    ),
  ).not.toThrow();
});

test("renders nothing for an empty week", () => {
  const { container } = render(
    <MobileWeekView onSelectTrainingSession={vi.fn()} week={[]} />,
  );

  expect(container.firstChild).toBeNull();
});

test("falls back to the new week when its selected date is no longer present", () => {
  const { rerender } = render(
    <MobileWeekView onSelectTrainingSession={vi.fn()} week={createWeek()} />,
  );
  fireEvent.click(screen.getByRole("tab", { name: "Tuesday 18 August" }));

  rerender(
    <MobileWeekView
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
