import { fireEvent, render, screen } from "@testing-library/react";
import { TrainingActivityCard } from "./training-activity-card";
import type { TrainingActivity } from "../types/training-planner-types";

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
    targetDistanceMetres: 6000,
    targetDurationSeconds: 1530,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
    ...override,
  } as TrainingActivity;
}

test("renders a compact activity summary", () => {
  render(<TrainingActivityCard activity={runActivity()} />);

  const card = screen.getByRole("button", { name: "View Tempo run details" });

  expect(card).toBeDefined();
  expect(screen.getByText("Tempo run").className).toContain("line-clamp-2");
  expect(screen.getByText("6.0 km · 25m 30s")).toBeDefined();
  expect(screen.getByText("Scheduled")).toBeDefined();
  expect(screen.getByText("Run", { selector: ".sr-only" })).toBeDefined();
  expect(document.querySelector("svg.lucide-sport-shoe")).not.toBeNull();
  expect(screen.queryByText("Controlled effort")).toBeNull();
});

test("merges an optional class name into the activity button", () => {
  render(<TrainingActivityCard activity={runActivity()} className="!cursor-grab" />);

  expect(
    screen.getByRole("button", { name: "View Tempo run details" }).className,
  ).toContain("!cursor-grab");
});

test.each([
  ["SCHEDULED", "lucide-clock-3", "text-zinc-600"],
  ["COMPLETED", "lucide-circle-check", "text-green-700"],
  ["SKIPPED", "lucide-circle-minus", "text-amber-700"],
] as const)(
  "renders %s activities with a status icon and label",
  (status, iconClass, labelClass) => {
    render(<TrainingActivityCard activity={runActivity({ status })} />);

    const card = screen.getByRole("button", {
      name: "View Tempo run details",
    });
    const statusLabel = screen.getByText(
      status.charAt(0) + status.slice(1).toLowerCase(),
    );

    expect(card.className).toContain("border-zinc-200");
    expect(card.className).toContain("bg-white");
    expect(card.className).not.toContain("shadow");
    expect(statusLabel.className).toContain(labelClass);
    expect(card.querySelector(`svg.${iconClass}`)).not.toBeNull();
  },
);

test("shows actual run metrics after completion", () => {
  render(
    <TrainingActivityCard
      activity={
        runActivity({
          status: "COMPLETED",
          actualDistanceMetres: 6250,
          actualDurationSeconds: 1575,
        })
      }
    />,
  );

  expect(screen.getByText("6.3 km · 26m 15s")).toBeDefined();
  expect(screen.queryByText("6.0 km · 25m 30s")).toBeNull();
});

test("shows duration only for strength activities", () => {
  render(
    <TrainingActivityCard
      activity={{
        ...runActivity(),
        activityType: "STRENGTH",
        targetDurationSeconds: 5400,
        actualDurationSeconds: null,
      }}
    />,
  );

  expect(screen.getByText("1h 30m")).toBeDefined();
  expect(screen.getByText("Strength", { selector: ".sr-only" })).toBeDefined();
  expect(document.querySelector("svg.lucide-dumbbell")).not.toBeNull();
});

test("omits seconds from durations over one hour", () => {
  render(
    <TrainingActivityCard
      activity={runActivity({ targetDurationSeconds: 3849 })}
    />,
  );

  expect(screen.getByText("6.0 km · 1h 4m")).toBeDefined();
  expect(screen.queryByText("6.0 km · 1h 4m 9s")).toBeNull();
});

test("uses the standard border for an activity card", () => {
  render(<TrainingActivityCard activity={runActivity()} />);

  const card = screen.getByRole("button", { name: "View Tempo run details" });
  expect(card.className).toContain("border-zinc-200");
  expect(card.className).not.toContain("border-teal-300");
  expect(card.className).not.toContain("ring-");
});

test("does not render descriptions in the planner overview", () => {
  render(
    <TrainingActivityCard activity={runActivity({ title: "Easy run" })} />,
  );

  expect(
    screen.getByRole("button", { name: "View Easy run details" }),
  ).toBeDefined();
  expect(screen.queryByText("Controlled effort")).toBeNull();
});

test("calls the select handler when clicked", () => {
  const onSelect = vi.fn();

  render(<TrainingActivityCard activity={runActivity()} onSelect={onSelect} />);
  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );

  expect(onSelect).toHaveBeenCalledTimes(1);
});
