import { fireEvent, render, screen } from "@testing-library/react";
import {
  createRunTrainingSession,
  createStrengthTrainingSession,
} from "@/test-support/fixtures/training-session";
import { TrainingSessionCard } from "./training-session-card";
import { DistanceDisplayProvider } from "@/ui/users/measurement-unit-context";
import type { TrainingSession } from "@/domain/training-sessions";

function runTrainingSession(
  override: Partial<TrainingSession> = {},
): TrainingSession {
  return {
    ...createRunTrainingSession({
      id: "training-session",
      description: "Controlled effort",
      targetDistanceMetres: 6000,
      targetDurationSeconds: 1530,
    }),
    ...override,
  } as TrainingSession;
}

test("renders a compact training session summary", () => {
  render(<TrainingSessionCard trainingSession={runTrainingSession()} />);

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
      <TrainingSessionCard trainingSession={runTrainingSession()} />
    </DistanceDisplayProvider>,
  );

  expect(screen.getByText("3.73 mi · 25m 30s")).toBeDefined();
});

test("merges an optional class name into the training session button", () => {
  render(
    <TrainingSessionCard
      trainingSession={runTrainingSession()}
      className="!cursor-grab"
    />,
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
  "renders %s training sessions with a status icon and label",
  (status, iconClass, labelClass) => {
    render(
      <TrainingSessionCard trainingSession={runTrainingSession({ status })} />,
    );

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
    <TrainingSessionCard
      trainingSession={runTrainingSession({
        status: "COMPLETED",
        actualDistanceMetres: 6250,
        actualDurationSeconds: 1575,
      })}
    />,
  );

  expect(screen.getByText("6.25 km · 26m 15s")).toBeDefined();
  expect(screen.queryByText("6.00 km · 25m 30s")).toBeNull();
});

test("shows duration only for strength training sessions", () => {
  render(
    <TrainingSessionCard
      trainingSession={{
        ...createStrengthTrainingSession({
          id: "training-session",
          title: "Tempo run",
          description: "Controlled effort",
          targetDurationSeconds: 5400,
        }),
      }}
    />,
  );

  expect(screen.getByText("1h 30m")).toBeDefined();
  expect(screen.getByText("Strength", { selector: ".sr-only" })).toBeDefined();
  expect(document.querySelector("svg.lucide-dumbbell")).not.toBeNull();
});

test("omits seconds from durations over one hour", () => {
  render(
    <TrainingSessionCard
      trainingSession={runTrainingSession({ targetDurationSeconds: 3849 })}
    />,
  );

  expect(screen.getByText("6.00 km · 1h 4m")).toBeDefined();
  expect(screen.queryByText("6.00 km · 1h 4m 9s")).toBeNull();
});

test("uses the standard border for a training session card", () => {
  render(<TrainingSessionCard trainingSession={runTrainingSession()} />);

  const card = screen.getByRole("button", { name: "View Tempo run details" });
  expect(card.className).toContain("border-zinc-200");
  expect(card.className).not.toContain("border-teal-300");
  expect(card.className).not.toContain("ring-");
});

test("does not render descriptions in the planner overview", () => {
  render(
    <TrainingSessionCard
      trainingSession={runTrainingSession({ title: "Easy run" })}
    />,
  );

  expect(
    screen.getByRole("button", { name: "View Easy run details" }),
  ).toBeDefined();
  expect(screen.queryByText("Controlled effort")).toBeNull();
});

test("calls the select handler when clicked", () => {
  const onSelect = vi.fn();

  render(
    <TrainingSessionCard
      trainingSession={runTrainingSession()}
      onSelect={onSelect}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "View Tempo run details" }),
  );

  expect(onSelect).toHaveBeenCalledTimes(1);
});
