import { fireEvent, render, screen, within } from "@testing-library/react";

import { MobileWeekView } from "./mobile-week-view";
import type {
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";

const baseActivity = {
  activityType: "RUN",
  actualDistanceMetres: null,
  actualDurationSeconds: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  date: "2026-08-19",
  day: "Wednesday",
  description: null,
  id: "activity",
  skipReason: null,
  sortOrder: 0,
  status: "SCHEDULED",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1800,
  timeOfDay: "AM",
  title: "Easy run",
  updatedAt: "2026-08-01T10:00:00.000Z",
} satisfies TrainingActivity;

function activity(overrides: Partial<TrainingActivity> = {}): TrainingActivity {
  return { ...baseActivity, ...overrides } as TrainingActivity;
}

function createWeek(): TrainingDay[] {
  return [
    { day: "Monday", date: "2026-08-17", activities: [] },
    { day: "Tuesday", date: "2026-08-18", activities: [] },
    {
      day: "Wednesday",
      date: "2026-08-19",
      activities: [
        activity({ id: "morning", title: "Easy run" }),
        activity({
          activityType: "STRENGTH",
          id: "evening",
          targetDurationSeconds: 2700,
          timeOfDay: "PM",
          title: "Strength",
        }),
        activity({
          id: "anytime",
          timeOfDay: null,
          title: "Recovery run",
        }),
      ],
    },
    { day: "Thursday", date: "2026-08-20", activities: [] },
    { day: "Friday", date: "2026-08-21", activities: [] },
    { day: "Saturday", date: "2026-08-22", activities: [] },
    { day: "Sunday", date: "2026-08-23", activities: [] },
  ];
}

afterEach(() => {
  vi.useRealTimers();
});

test("defaults to today and renders its full-width agenda in time order", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-19T12:00:00"));

  render(<MobileWeekView onSelectActivity={vi.fn()} week={createWeek()} />);

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
  render(<MobileWeekView onSelectActivity={vi.fn()} week={createWeek()} />);

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

test("forwards activity details and the selected day add action", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-19T12:00:00"));
  const onAddActivity = vi.fn();
  const onSelectActivity = vi.fn();
  const week = createWeek();
  render(
    <MobileWeekView
      onAddActivity={onAddActivity}
      onSelectActivity={onSelectActivity}
      week={week}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "View Easy run details" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Add activity to Wednesday" }),
  );

  expect(onSelectActivity).toHaveBeenCalledWith(week[2].activities[0]);
  expect(onAddActivity).toHaveBeenCalledWith(week[2]);
  expect(screen.getByText("+ Add activity")).toBeDefined();
});

test("supports an omitted add handler and a day without a date", () => {
  render(
    <MobileWeekView
      onSelectActivity={vi.fn()}
      week={[{ day: "Monday", activities: [] }]}
    />,
  );

  const tab = screen.getByRole("tab", { name: "Monday" });
  expect(tab.textContent).toBe("Mon");
  expect(() =>
    fireEvent.click(
      screen.getByRole("button", { name: "Add activity to Monday" }),
    ),
  ).not.toThrow();
});

test("renders nothing for an empty week", () => {
  const { container } = render(
    <MobileWeekView onSelectActivity={vi.fn()} week={[]} />,
  );

  expect(container.firstChild).toBeNull();
});

test("falls back to the new week when its selected date is no longer present", () => {
  const { rerender } = render(
    <MobileWeekView onSelectActivity={vi.fn()} week={createWeek()} />,
  );
  fireEvent.click(screen.getByRole("tab", { name: "Tuesday 18 August" }));

  rerender(
    <MobileWeekView
      onSelectActivity={vi.fn()}
      week={[
        { day: "Monday", date: "2026-08-24", activities: [] },
        { day: "Tuesday", date: "2026-08-25", activities: [] },
      ]}
    />,
  );

  expect(
    screen
      .getByRole("tab", { name: "Monday 24 August" })
      .getAttribute("aria-selected"),
  ).toBe("true");
});
