import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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

const navigationProps = {
  isCurrentWeek: true,
  onCurrentWeek: () => undefined,
  onNextWeek: () => undefined,
  onPreviousWeek: () => undefined,
  weekRange: { from: "2026-08-17", to: "2026-08-23" },
};

test("renders one column for each day of the week", () => {
  render(<TrainingPlannerView {...navigationProps} week={testWeek} />);

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
  render(<TrainingPlannerView {...navigationProps} week={testWeek} />);

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
  render(<TrainingPlannerView {...navigationProps} week={testWeek} />);

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
  render(<TrainingPlannerView {...navigationProps} week={testWeek} />);

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

test("opens edit from details and cancels back to details", () => {
  render(<TrainingPlannerView {...navigationProps} week={testWeek} />);
  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit activity" }));

  expect(screen.queryByRole("dialog", { name: "Tempo run" })).toBeNull();
  expect(screen.getByRole("dialog", { name: "Edit activity" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog", { name: "Edit activity" })).toBeNull();
  expect(screen.getByRole("dialog", { name: "Tempo run" })).toBeDefined();
});

test("deletes the selected activity and closes its details", async () => {
  const onDeleteActivity = vi.fn().mockResolvedValue(undefined);
  render(
    <TrainingPlannerView
      {...navigationProps}
      onDeleteActivity={onDeleteActivity}
      week={testWeek}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Delete activity" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));

  await waitFor(() => expect(onDeleteActivity).toHaveBeenCalledOnce());
  expect(onDeleteActivity).toHaveBeenCalledWith("monday-am-run");
  expect(screen.queryByRole("dialog", { name: "Tempo run" })).toBeNull();
});

test("supports the default delete handler", async () => {
  render(<TrainingPlannerView {...navigationProps} week={testWeek} />);
  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Delete activity" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));

  await waitFor(() =>
    expect(screen.queryByRole("dialog", { name: "Tempo run" })).toBeNull(),
  );
});

test("keeps activity details open after a failed deletion", async () => {
  render(
    <TrainingPlannerView
      {...navigationProps}
      onDeleteActivity={vi.fn().mockRejectedValue(new Error("nope"))}
      week={testWeek}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Delete activity" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));

  expect((await screen.findByRole("alert")).textContent).toContain(
    "Unable to delete activity",
  );
  expect(screen.getByRole("dialog", { name: "Tempo run" })).toBeDefined();
});

test("saves an edit and returns updated details", async () => {
  const onEditActivity = vi.fn().mockImplementation(async (_id, request) => ({
    ...runActivity(),
    ...request,
    id: "monday-am-run",
  }));
  render(
    <TrainingPlannerView
      {...navigationProps}
      isEditingActivity={false}
      onEditActivity={onEditActivity}
      week={testWeek}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit activity" }));
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Updated tempo" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

  await waitFor(() => expect(onEditActivity).toHaveBeenCalledOnce());
  expect(onEditActivity).toHaveBeenCalledWith(
    "monday-am-run",
    expect.objectContaining({ title: "Updated tempo" }),
  );
  expect(
    await screen.findByRole("dialog", { name: "Updated tempo" }),
  ).toBeDefined();
});

test("supports the default edit handler", async () => {
  render(<TrainingPlannerView {...navigationProps} week={testWeek} />);
  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit activity" }));
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Local update" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(
    await screen.findByRole("dialog", { name: "Local update" }),
  ).toBeDefined();
});

test("closes activity details from the backdrop", () => {
  render(<TrainingPlannerView {...navigationProps} week={testWeek} />);

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
  render(<TrainingPlannerView {...navigationProps} week={testWeek} />);

  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );
  expect(screen.getByRole("dialog", { name: "Tempo run" })).toBeDefined();

  fireEvent.keyDown(window, { key: "Escape", code: "Escape" });

  expect(screen.queryByRole("dialog", { name: "Tempo run" })).toBeNull();
});

test("opens activity details with keyboard activation", () => {
  render(<TrainingPlannerView {...navigationProps} week={testWeek} />);

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
      {...navigationProps}
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
      {...navigationProps}
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

test("skips the selected activity and closes its details", async () => {
  const onSkipActivity = vi.fn().mockResolvedValue(undefined);
  render(<TrainingPlannerView {...navigationProps} onSkipActivity={onSkipActivity} week={testWeek} />);
  fireEvent.click(screen.getByRole("button", { name: "View Tempo run details" }));
  fireEvent.click(screen.getByRole("button", { name: "Skip activity" }));
  fireEvent.change(screen.getByLabelText("Skip reason"), { target: { value: "Recovery" } });
  fireEvent.click(screen.getByRole("button", { name: "Skip activity" }));
  await waitFor(() => expect(onSkipActivity).toHaveBeenCalledWith("monday-am-run", { skipReason: "Recovery" }));
  expect(screen.queryByRole("dialog", { name: "Tempo run" })).toBeNull();
});

test("completes the selected activity and closes its details", async () => {
  const onCompleteActivity = vi.fn().mockResolvedValue(undefined);
  render(<TrainingPlannerView {...navigationProps} onCompleteActivity={onCompleteActivity} week={testWeek} />);
  fireEvent.click(screen.getByRole("button", { name: "View Tempo run details" }));
  fireEvent.click(screen.getByRole("button", { name: "Complete activity" }));
  fireEvent.change(screen.getByLabelText("Actual duration (minutes)"), { target: { value: "40" } });
  fireEvent.change(screen.getByLabelText("Actual distance (km)"), { target: { value: "6" } });
  fireEvent.click(screen.getByRole("button", { name: "Complete activity" }));
  await waitFor(() => expect(onCompleteActivity).toHaveBeenCalledWith("monday-am-run", { actualDurationSeconds: 2400, actualDistanceMetres: 6000 }));
  expect(screen.queryByRole("dialog", { name: "Tempo run" })).toBeNull();
});

test("supports default skip and complete handlers", async () => {
  const { rerender } = render(<TrainingPlannerView {...navigationProps} week={testWeek} />);
  fireEvent.click(screen.getByRole("button", { name: "View Tempo run details" }));
  fireEvent.click(screen.getByRole("button", { name: "Skip activity" }));
  fireEvent.change(screen.getByLabelText("Skip reason"), { target: { value: "Rest" } });
  fireEvent.click(screen.getByRole("button", { name: "Skip activity" }));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Tempo run" })).toBeNull());

  rerender(<TrainingPlannerView {...navigationProps} week={testWeek} />);
  fireEvent.click(screen.getByRole("button", { name: "View Tempo run details" }));
  fireEvent.click(screen.getByRole("button", { name: "Complete activity" }));
  fireEvent.change(screen.getByLabelText("Actual duration (minutes)"), { target: { value: "30" } });
  fireEvent.change(screen.getByLabelText("Actual distance (km)"), { target: { value: "5" } });
  fireEvent.click(screen.getByRole("button", { name: "Complete activity" }));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Tempo run" })).toBeNull());
});

test("TrainingActivityCard omits descriptions from the planner overview", () => {
  const { rerender } = render(
    <TrainingActivityCard
      activity={runActivity({ description: "45 minutes" })}
    />,
  );

  expect(screen.queryByText("45 minutes")).toBeNull();

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

test("renders the selected range and week navigation controls", () => {
  const onCurrentWeek = vi.fn();
  const onNextWeek = vi.fn();
  const onPreviousWeek = vi.fn();
  const { rerender } = render(
    <TrainingPlannerView
      {...navigationProps}
      isCurrentWeek={false}
      onCurrentWeek={onCurrentWeek}
      onNextWeek={onNextWeek}
      onPreviousWeek={onPreviousWeek}
      week={testWeek}
    />,
  );

  expect(screen.getByText("17–23 August 2026")).toBeDefined();
  const navigation = screen.getByRole("navigation", {
    name: "Week navigation",
  });
  fireEvent.click(
    within(navigation).getByRole("button", { name: "Previous week" }),
  );
  fireEvent.click(
    within(navigation).getByRole("button", { name: "Current week" }),
  );
  fireEvent.click(
    within(navigation).getByRole("button", { name: "Next week" }),
  );

  expect(onPreviousWeek).toHaveBeenCalledOnce();
  expect(onCurrentWeek).toHaveBeenCalledOnce();
  expect(onNextWeek).toHaveBeenCalledOnce();

  rerender(
    <TrainingPlannerView {...navigationProps} isCurrentWeek week={testWeek} />,
  );
  expect(screen.queryByRole("button", { name: "Current week" })).toBeNull();
});

test("opens, closes, and submits the add activity modal", async () => {
  const onCreateActivity = vi.fn().mockResolvedValue(undefined);
  const week = testWeek.map((day, index) => ({
    ...day,
    date: `2026-08-${String(17 + index).padStart(2, "0")}`,
  }));
  render(
    <TrainingPlannerView
      {...navigationProps}
      isCreatingActivity={false}
      onCreateActivity={onCreateActivity}
      week={week}
    />,
  );

  fireEvent.click(screen.getAllByRole("button", { name: "Add activity" })[0]);
  expect(screen.getByRole("dialog", { name: "Add activity" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog", { name: "Add activity" })).toBeNull();

  fireEvent.click(screen.getAllByRole("button", { name: "Add activity" })[0]);
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Easy run" },
  });
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "5" },
  });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "30" },
  });
  fireEvent.click(
    within(screen.getByRole("dialog", { name: "Add activity" })).getByRole(
      "button",
      { name: "Add activity" },
    ),
  );

  await waitFor(() => expect(onCreateActivity).toHaveBeenCalledOnce());
  expect(onCreateActivity).toHaveBeenCalledWith(
    expect.objectContaining({ date: "2026-08-17", title: "Easy run" }),
  );
  expect(screen.queryByRole("dialog", { name: "Add activity" })).toBeNull();
});

test("supports the default create handler", async () => {
  render(
    <TrainingPlannerView
      {...navigationProps}
      week={[{ day: "Monday", date: "2026-08-17", activities: [] }]}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Add activity" }));
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Easy run" },
  });
  fireEvent.change(screen.getByLabelText("Distance (km)"), {
    target: { value: "5" },
  });
  fireEvent.change(screen.getByLabelText("Duration (minutes)"), {
    target: { value: "30" },
  });
  fireEvent.click(
    within(screen.getByRole("dialog", { name: "Add activity" })).getByRole(
      "button",
      { name: "Add activity" },
    ),
  );

  await waitFor(() =>
    expect(screen.queryByRole("dialog", { name: "Add activity" })).toBeNull(),
  );
});
