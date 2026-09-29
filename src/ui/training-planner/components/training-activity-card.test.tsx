import { fireEvent, render, screen } from "@testing-library/react";
import {
  createRunActivity,
  createStrengthActivity,
} from "@/test-support/fixtures/activity";
import { TrainingActivityCard } from "./training-activity-card";
import { DistanceDisplayProvider } from "@/ui/users/measurement-unit-context";
import type { TrainingActivity } from "../types/training-planner-types";

function runActivity(
  override: Partial<TrainingActivity> = {},
): TrainingActivity {
  return {
    ...createRunActivity({
      id: "activity",
      description: "Controlled effort",
      targetDistanceMetres: 6000,
      targetDurationSeconds: 1530,
    }),
    day: "Monday",
    ...override,
  } as TrainingActivity;
}

test("renders a compact activity summary", () => {
  render(<TrainingActivityCard activity={runActivity()} />);

  const card = screen.getByRole("button", { name: "View Tempo run details" });

  expect(card).toBeDefined();
  expect(screen.getByText("Tempo run").className).toContain("line-clamp-2");
  expect(screen.getByText("6.00 km · 25m 30s")).toBeDefined();
  expect(screen.getByText("Scheduled")).toBeDefined();
  expect(screen.getByText("Run", { selector: ".sr-only" })).toBeDefined();
  expect(document.querySelector("svg.lucide-sport-shoe")).not.toBeNull();
  expect(screen.queryByText("Controlled effort")).toBeNull();
});

test("shows the selected distance unit in a run card", () => {
  render(
    <DistanceDisplayProvider measurementUnit="MILES">
      <TrainingActivityCard activity={runActivity()} />
    </DistanceDisplayProvider>,
  );

  expect(screen.getByText("3.73 mi · 25m 30s")).toBeDefined();
});

test("merges an optional class name into the activity button", () => {
  render(
    <TrainingActivityCard activity={runActivity()} className="!cursor-grab" />,
  );

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
      activity={runActivity({
        status: "COMPLETED",
        actualDistanceMetres: 6250,
        actualDurationSeconds: 1575,
      })}
    />,
  );

  expect(screen.getByText("6.25 km · 26m 15s")).toBeDefined();
  expect(screen.queryByText("6.00 km · 25m 30s")).toBeNull();
});

test("shows duration only for strength activities", () => {
  render(
    <TrainingActivityCard
      activity={{
        ...createStrengthActivity({
          id: "activity",
          title: "Tempo run",
          description: "Controlled effort",
          targetDurationSeconds: 5400,
        }),
        day: "Monday",
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

  expect(screen.getByText("6.00 km · 1h 4m")).toBeDefined();
  expect(screen.queryByText("6.00 km · 1h 4m 9s")).toBeNull();
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
