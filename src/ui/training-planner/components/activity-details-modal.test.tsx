import { fireEvent, render, screen, within } from "@testing-library/react";
import { ActivityDetailsModal } from "./activity-details-modal";
import type { TrainingActivity } from "../types/training-planner-types";

type RunTrainingActivity = Extract<TrainingActivity, { activityType: "RUN" }>;
type StrengthTrainingActivity = Extract<
  TrainingActivity,
  { activityType: "STRENGTH" }
>;
type RunTrainingActivityOverride = Omit<
  Partial<RunTrainingActivity>,
  | "targetDistanceMetres"
  | "targetDurationSeconds"
  | "targetPaceSecondsPerKilometre"
  | "targetType"
> & {
  targetDistanceMetres?: number | null;
  targetDurationSeconds?: number | null;
  targetPaceSecondsPerKilometre?: number | null;
  targetType?: "DISTANCE_DURATION" | "DISTANCE_PACE" | "DURATION_PACE";
};

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
  updatedAt: "2026-08-01T11:30:00.000Z",
  day: "Monday",
} satisfies Partial<TrainingActivity>;

function runActivity(
  override: RunTrainingActivityOverride = {},
): TrainingActivity {
  return {
    ...baseActivity,
    activityType: "RUN",
    targetType: "DISTANCE_PACE",
    targetDistanceMetres: 6000,
    targetDurationSeconds: null,
    targetPaceSecondsPerKilometre: 255,
    actualDistanceMetres: 5900,
    actualDurationSeconds: 1500,
    ...override,
  } as TrainingActivity;
}

function strengthActivity(
  override: Partial<StrengthTrainingActivity> = {},
): TrainingActivity {
  return {
    ...baseActivity,
    id: "strength",
    title: "Strength",
    activityType: "STRENGTH",
    timeOfDay: "PM",
    targetDurationSeconds: 2700,
    actualDurationSeconds: 2400,
    ...override,
  } as TrainingActivity;
}

test("calls the close handler from the close button", () => {
  const onClose = vi.fn();

  render(<ActivityDetailsModal activity={runActivity()} onClose={onClose} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Close activity details" }),
  );

  expect(onClose).toHaveBeenCalledTimes(1);
});

test("calls the close handler from the backdrop", () => {
  const onClose = vi.fn();

  render(<ActivityDetailsModal activity={runActivity()} onClose={onClose} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Dismiss activity details" }),
  );

  expect(onClose).toHaveBeenCalledTimes(1);
});

test("calls the close handler from the Escape key", () => {
  const onClose = vi.fn();

  render(<ActivityDetailsModal activity={runActivity()} onClose={onClose} />);
  fireEvent.keyDown(window, { key: "Escape", code: "Escape" });

  expect(onClose).toHaveBeenCalledTimes(1);
});

test("ignores non-Escape keys", () => {
  const onClose = vi.fn();

  render(<ActivityDetailsModal activity={runActivity()} onClose={onClose} />);
  fireEvent.keyDown(window, { key: "Enter", code: "Enter" });

  expect(onClose).not.toHaveBeenCalled();
});

test("renders as a large centered modal", () => {
  render(<ActivityDetailsModal activity={runActivity()} onClose={vi.fn()} />);

  const modal = screen.getByRole("dialog", { name: "Tempo run" });
  const overlay = modal.parentElement;

  expect(overlay?.classList.contains("items-center")).toBe(true);
  expect(overlay?.classList.contains("justify-center")).toBe(true);
  expect(modal.classList.contains("max-w-4xl")).toBe(true);
  expect(modal.classList.contains("max-h-[calc(100dvh-2rem)]")).toBe(true);
  expect(modal.classList.contains("rounded-xl")).toBe(true);
  expect(modal.classList.contains("overflow-y-auto")).toBe(true);
});

test("renders full run activity details with formatted values", () => {
  render(<ActivityDetailsModal activity={runActivity()} onClose={vi.fn()} />);

  const panel = screen.getByRole("dialog", {
    name: "Tempo run",
  });
  expect(
    within(panel).getByRole("heading", { level: 2, name: "Tempo run" }),
  ).toBeDefined();
  expect(within(panel).getAllByText("Run").length).toBeGreaterThan(0);
  expect(within(panel).getByText("AM")).toBeDefined();
  expect(within(panel).getByText("Scheduled")).toBeDefined();
  expect(within(panel).getByText("Controlled effort")).toBeDefined();
  expect(within(panel).getByText("Distance + Pace")).toBeDefined();
  expect(within(panel).getByText("6.0 km")).toBeDefined();
  expect(within(panel).getByText("4:15 / km")).toBeDefined();
  expect(within(panel).getByText("5.9 km")).toBeDefined();
  expect(within(panel).getByText("25 min")).toBeDefined();
  expect(within(panel).queryByText("activity")).toBeNull();
  expect(within(panel).queryByText("0")).toBeNull();
  expect(within(panel).queryByText("1 Aug 2026, 10:00")).toBeNull();
  expect(within(panel).queryByText("1 Aug 2026, 11:30")).toBeNull();
});

test("renders primary planned metrics before secondary details", () => {
  render(<ActivityDetailsModal activity={runActivity()} onClose={vi.fn()} />);

  const panel = screen.getByRole("dialog", {
    name: "Tempo run",
  });
  const distance = within(panel).getByText("6.0 km");
  const time = within(panel).getByText("AM");
  const duration = within(panel).getByText("No target duration");
  const pace = within(panel).getByText("4:15 / km");
  const descriptionHeading = within(panel).getByRole("heading", {
    level: 3,
    name: "Description",
  });
  const detailsHeading = within(panel).getByRole("heading", {
    level: 3,
    name: "Details",
  });
  const actualDistance = within(panel).getByText("5.9 km");

  expect(distance.compareDocumentPosition(time)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(time.compareDocumentPosition(duration)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(duration.compareDocumentPosition(pace)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(pace.compareDocumentPosition(descriptionHeading)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(descriptionHeading.compareDocumentPosition(detailsHeading)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(detailsHeading.compareDocumentPosition(actualDistance)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
});

test("renders distance and duration run targets", () => {
  render(
    <ActivityDetailsModal
      activity={runActivity({
        targetType: "DISTANCE_DURATION",
        targetDurationSeconds: 2400,
        targetPaceSecondsPerKilometre: null,
      })}
      onClose={vi.fn()}
    />,
  );

  const panel = screen.getByRole("dialog", {
    name: "Tempo run",
  });
  expect(within(panel).getByText("No target pace")).toBeDefined();
  expect(within(panel).getByText("40 min")).toBeDefined();
  expect(within(panel).getByText("6.0 km")).toBeDefined();
  expect(within(panel).getByText("Distance + Duration")).toBeDefined();
});

test("renders duration and pace run targets", () => {
  render(
    <ActivityDetailsModal
      activity={runActivity({
        targetType: "DURATION_PACE",
        targetDistanceMetres: null,
        targetDurationSeconds: 1800,
      })}
      onClose={vi.fn()}
    />,
  );

  const panel = screen.getByRole("dialog", {
    name: "Tempo run",
  });
  expect(within(panel).getByText("4:15 / km")).toBeDefined();
  expect(within(panel).getByText("30 min")).toBeDefined();
  expect(within(panel).getByText("No target distance")).toBeDefined();
  expect(within(panel).getByText("Duration + Pace")).toBeDefined();
});

test("renders run actual distance without actual duration", () => {
  render(
    <ActivityDetailsModal
      activity={runActivity({
        actualDurationSeconds: null,
      })}
      onClose={vi.fn()}
    />,
  );

  const panel = screen.getByRole("dialog", {
    name: "Tempo run",
  });
  expect(within(panel).getByText("Actual distance")).toBeDefined();
  expect(within(panel).getByText("5.9 km")).toBeDefined();
  expect(within(panel).queryByText("Actual duration")).toBeNull();
});

test("renders run actual duration without actual distance", () => {
  render(
    <ActivityDetailsModal
      activity={runActivity({
        actualDistanceMetres: null,
      })}
      onClose={vi.fn()}
    />,
  );

  const panel = screen.getByRole("dialog", {
    name: "Tempo run",
  });
  expect(within(panel).queryByText("Actual distance")).toBeNull();
  expect(within(panel).getByText("Actual duration")).toBeDefined();
  expect(within(panel).getByText("25 min")).toBeDefined();
});

test("renders strength details with duration values", () => {
  render(
    <ActivityDetailsModal activity={strengthActivity()} onClose={vi.fn()} />,
  );

  const panel = screen.getByRole("dialog", {
    name: "Strength",
  });
  expect(
    within(panel).getByRole("heading", { level: 2, name: "Strength" }),
  ).toBeDefined();
  expect(within(panel).getAllByText("Strength").length).toBeGreaterThan(0);
  expect(within(panel).getByText("45 min")).toBeDefined();
  expect(within(panel).getByText("40 min")).toBeDefined();
  expect(
    within(panel)
      .getByText("PM")
      .compareDocumentPosition(within(panel).getByText("45 min")),
  ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
});

test("renders null metrics and optional fields as empty values", () => {
  render(
    <ActivityDetailsModal
      activity={runActivity({
        description: null,
        targetDistanceMetres: null,
        targetDurationSeconds: null,
        targetPaceSecondsPerKilometre: null,
        actualDistanceMetres: null,
        actualDurationSeconds: null,
        targetType: "DURATION_PACE",
        timeOfDay: null,
      })}
      onClose={vi.fn()}
    />,
  );

  const panel = screen.getByRole("dialog", {
    name: "Tempo run",
  });
  expect(within(panel).getByText("Any time")).toBeDefined();
  expect(within(panel).getByText("No target pace")).toBeDefined();
  expect(within(panel).getByText("No target duration")).toBeDefined();
  expect(within(panel).getByText("No target distance")).toBeDefined();
  expect(within(panel).getByText("No description")).toBeDefined();
  expect(within(panel).queryByText("Actual distance")).toBeNull();
  expect(within(panel).queryByText("Actual duration")).toBeNull();
});

test("renders skipped activity metadata", () => {
  render(
    <ActivityDetailsModal
      activity={strengthActivity({
        status: "SKIPPED",
        description: null,
        skipReason: "Travel day",
      })}
      onClose={vi.fn()}
    />,
  );

  const panel = screen.getByRole("dialog", {
    name: "Strength",
  });
  expect(within(panel).getByText("Skipped")).toBeDefined();
  expect(within(panel).getByText("Travel day")).toBeDefined();
});
