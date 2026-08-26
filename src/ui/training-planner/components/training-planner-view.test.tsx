import { fireEvent, render, screen, within } from "@testing-library/react";
import { TrainingActivityCard } from "./training-activity-card";
import { TrainingPlannerView } from "./training-planner-view";
import type {
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";

const baseActivity = {
  id: "activity",
  title: "Tempo run",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: "Controlled effort",
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
    targetType: "DISTANCE_PACE",
    targetDistanceMetres: 6000,
    targetDurationSeconds: null,
    targetPaceSecondsPerKilometre: 255,
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

const testWeek: TrainingDay[] = [
  {
    day: "Monday",
    activities: [
      runActivity({ id: "monday-am-run", title: "Tempo run" }),
      runActivity({ id: "monday-am-strides", title: "Strides", sortOrder: 1 }),
      strengthActivity({
        id: "monday-any-strength",
        title: "Strength",
        timeOfDay: null,
      }),
      strengthActivity({ id: "monday-pm-lift", title: "Evening lift" }),
    ],
  },
  {
    day: "Tuesday",
    activities: [strengthActivity({ id: "tuesday-pm-lift", day: "Tuesday" })],
  },
  { day: "Wednesday", activities: [] },
  { day: "Thursday", activities: [] },
  { day: "Friday", activities: [] },
  { day: "Saturday", activities: [] },
  { day: "Sunday", activities: [] },
];

test("renders one column for each day of the week", () => {
  render(<TrainingPlannerView week={testWeek} />);

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
  render(<TrainingPlannerView week={testWeek} />);

  const monday = screen
    .getByRole("heading", { level: 2, name: "Monday" })
    .closest("article");

  expect(monday).not.toBeNull();

  const mondayColumn = within(monday as HTMLElement);
  const amSection = mondayColumn
    .getByRole("heading", { level: 3, name: "AM" })
    .closest("section");
  const anyTimeSection = mondayColumn
    .getByRole("heading", { level: 3, name: "Any time" })
    .closest("section");
  const pmSection = mondayColumn
    .getByRole("heading", { level: 3, name: "PM" })
    .closest("section");

  expect(within(amSection as HTMLElement).getByText("Tempo run")).toBeDefined();
  expect(within(amSection as HTMLElement).getByText("Strides")).toBeDefined();
  expect(
    within(anyTimeSection as HTMLElement).getByRole("button", {
      name: "View Strength details",
    }),
  ).toBeDefined();
  expect(
    within(pmSection as HTMLElement).getByText("Evening lift"),
  ).toBeDefined();
});

test("only renders time buckets that contain activities", () => {
  render(<TrainingPlannerView week={testWeek} />);

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
  expect(screen.getAllByText("No activity scheduled")).toHaveLength(5);
});

test("opens and closes full activity details from an activity card", () => {
  render(<TrainingPlannerView week={testWeek} />);

  expect(screen.queryByRole("dialog", { name: "Tempo run" })).toBeNull();

  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );

  const panel = screen.getByRole("dialog", {
    name: "Tempo run",
  });
  expect(
    within(panel).getByRole("heading", { name: "Tempo run" }),
  ).toBeDefined();
  expect(within(panel).getByText("Distance + Pace")).toBeDefined();
  expect(within(panel).getByText("6.0 km")).toBeDefined();
  expect(within(panel).getByText("4:15 / km")).toBeDefined();

  fireEvent.click(
    within(panel).getByRole("button", { name: "Close activity details" }),
  );

  expect(screen.queryByRole("dialog", { name: "Tempo run" })).toBeNull();
});

test("closes activity details from the backdrop", () => {
  render(<TrainingPlannerView week={testWeek} />);

  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );
  expect(screen.getByRole("dialog", { name: "Tempo run" })).toBeDefined();

  fireEvent.click(
    screen.getByRole("button", { name: "Dismiss activity details" }),
  );

  expect(screen.queryByRole("dialog", { name: "Tempo run" })).toBeNull();
});

test("closes activity details from the Escape key", () => {
  render(<TrainingPlannerView week={testWeek} />);

  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );
  expect(screen.getByRole("dialog", { name: "Tempo run" })).toBeDefined();

  fireEvent.keyDown(window, { key: "Escape", code: "Escape" });

  expect(screen.queryByRole("dialog", { name: "Tempo run" })).toBeNull();
});

test("opens activity details with keyboard activation", () => {
  render(<TrainingPlannerView week={testWeek} />);

  const button = screen.getByRole("button", {
    name: "View Evening lift details",
  });
  button.focus();
  fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
  fireEvent.click(button);

  const panel = screen.getByRole("dialog", {
    name: "Evening lift",
  });
  expect(
    within(panel).getByRole("heading", { name: "Evening lift" }),
  ).toBeDefined();
  expect(within(panel).getByText("45 min")).toBeDefined();
});

test("renders empty optional metrics in activity details", () => {
  render(
    <TrainingPlannerView
      week={[
        {
          day: "Monday",
          activities: [
            runActivity({
              targetPaceSecondsPerKilometre: null,
            }),
          ],
        },
        { day: "Tuesday", activities: [] },
        { day: "Wednesday", activities: [] },
        { day: "Thursday", activities: [] },
        { day: "Friday", activities: [] },
        { day: "Saturday", activities: [] },
        { day: "Sunday", activities: [] },
      ]}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );

  const panel = screen.getByRole("dialog", {
    name: "Tempo run",
  });
  expect(within(panel).getByText("No target pace")).toBeDefined();
});

test("renders skipped activity metadata in activity details", () => {
  render(
    <TrainingPlannerView
      week={[
        {
          day: "Monday",
          activities: [
            strengthActivity({
              status: "SKIPPED",
              timeOfDay: null,
              description: null,
              skipReason: "Travel day",
            }),
          ],
        },
        { day: "Tuesday", activities: [] },
        { day: "Wednesday", activities: [] },
        { day: "Thursday", activities: [] },
        { day: "Friday", activities: [] },
        { day: "Saturday", activities: [] },
        { day: "Sunday", activities: [] },
      ]}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "View Strength details" }),
  );

  const panel = screen.getByRole("dialog", {
    name: "Strength",
  });
  expect(within(panel).getByText("Any time")).toBeDefined();
  expect(within(panel).getByText("Skipped")).toBeDefined();
  expect(within(panel).getByText("Travel day")).toBeDefined();
});

test("TrainingActivityCard handles present and absent descriptions", () => {
  const { rerender } = render(
    <TrainingActivityCard
      activity={runActivity({ description: "45 minutes" })}
    />,
  );

  expect(screen.getByText("45 minutes")).toBeDefined();

  rerender(
    <TrainingActivityCard
      activity={strengthActivity({
        title: "Strength",
        description: null,
      })}
    />,
  );

  expect(
    screen.getByRole("button", { name: "View Strength details" }),
  ).toBeDefined();
  expect(screen.queryByText("45 minutes")).toBeNull();
});
