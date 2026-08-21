import { render, screen, within } from "@testing-library/react";
import { TrainingPlanner } from "./training-planner";
import type { TrainingDay } from "./types";

const testWeek: TrainingDay[] = [
  {
    day: "Monday",
    activities: [
      {
        id: "monday-am-run",
        title: "Tempo run",
        activityType: "Run",
        day: "Monday",
        timeOfDay: "AM",
      },
      {
        id: "monday-am-strides",
        title: "Strides",
        activityType: "Workout",
        day: "Monday",
        timeOfDay: "AM",
      },
      {
        id: "monday-any-mobility",
        title: "Mobility",
        activityType: "Recovery",
        day: "Monday",
        timeOfDay: null,
      },
      {
        id: "monday-pm-strength",
        title: "Strength",
        activityType: "Gym",
        day: "Monday",
        timeOfDay: "PM",
      },
    ],
  },
  {
    day: "Tuesday",
    activities: [
      {
        id: "tuesday-pm-lift",
        title: "Evening lift",
        activityType: "Gym",
        day: "Tuesday",
        timeOfDay: "PM",
      },
    ],
  },
  { day: "Wednesday", activities: [] },
  { day: "Thursday", activities: [] },
  { day: "Friday", activities: [] },
  { day: "Saturday", activities: [] },
  { day: "Sunday", activities: [] },
];

test("renders one column for each day of the week", () => {
  render(<TrainingPlanner week={testWeek} />);

  const planner = screen.getByRole("list", { name: "Weekly training planner" });
  expect(
    within(planner).getAllByRole("listitem", {
      name: /Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/,
    }),
  ).toHaveLength(7);

  for (const day of testWeek) {
    expect(
      screen.getByRole("heading", { level: 2, name: day.day }),
    ).toBeDefined();
  }
});

test("renders each time bucket and places activities in the correct bucket", () => {
  render(<TrainingPlanner week={testWeek} />);

  const monday = screen
    .getByRole("heading", { level: 2, name: "Monday" })
    .closest("article");

  expect(monday).not.toBeNull();

  const mondayColumn = within(monday as HTMLElement);
  expect(
    mondayColumn.getByRole("heading", { level: 3, name: "AM" }),
  ).toBeDefined();
  expect(
    mondayColumn.getByRole("heading", { level: 3, name: "Any time" }),
  ).toBeDefined();
  expect(
    mondayColumn.getByRole("heading", { level: 3, name: "PM" }),
  ).toBeDefined();

  const amSection = mondayColumn
    .getByRole("heading", { level: 3, name: "AM" })
    .closest("section");
  const anyTimeSection = mondayColumn
    .getByRole("heading", { level: 3, name: "Any time" })
    .closest("section");
  const pmSection = mondayColumn
    .getByRole("heading", { level: 3, name: "PM" })
    .closest("section");

  expect(amSection).not.toBeNull();
  expect(anyTimeSection).not.toBeNull();
  expect(pmSection).not.toBeNull();

  expect(within(amSection as HTMLElement).getByText("Tempo run")).toBeDefined();
  expect(within(amSection as HTMLElement).getByText("Strides")).toBeDefined();
  expect(
    within(anyTimeSection as HTMLElement).getByText("Mobility"),
  ).toBeDefined();
  expect(within(pmSection as HTMLElement).getByText("Strength")).toBeDefined();

  expect(within(amSection as HTMLElement).queryByText("Mobility")).toBeNull();
  expect(within(amSection as HTMLElement).queryByText("Strength")).toBeNull();
  expect(
    within(anyTimeSection as HTMLElement).queryByText("Tempo run"),
  ).toBeNull();
  expect(
    within(anyTimeSection as HTMLElement).queryByText("Strides"),
  ).toBeNull();
  expect(
    within(anyTimeSection as HTMLElement).queryByText("Strength"),
  ).toBeNull();
  expect(within(pmSection as HTMLElement).queryByText("Tempo run")).toBeNull();
  expect(within(pmSection as HTMLElement).queryByText("Strides")).toBeNull();
  expect(within(pmSection as HTMLElement).queryByText("Mobility")).toBeNull();
});

test("only renders time buckets that contain activities", () => {
  render(<TrainingPlanner week={testWeek} />);

  const tuesday = screen
    .getByRole("heading", { level: 2, name: "Tuesday" })
    .closest("article");

  expect(tuesday).not.toBeNull();
  const tuesdayColumn = within(tuesday as HTMLElement);

  expect(
    tuesdayColumn.queryByRole("heading", { level: 3, name: "AM" }),
  ).toBeNull();
  expect(
    tuesdayColumn.queryByRole("heading", { level: 3, name: "Any time" }),
  ).toBeNull();
  expect(
    tuesdayColumn.getByRole("heading", { level: 3, name: "PM" }),
  ).toBeDefined();
  expect(tuesdayColumn.getByText("Evening lift")).toBeDefined();
  expect(screen.queryByText("No activity scheduled")).toBeNull();
});
