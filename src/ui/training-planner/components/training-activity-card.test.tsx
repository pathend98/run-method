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
  expect(screen.getByText("Scheduled")).toBeDefined();
  expect(screen.getByText("Run")).toBeDefined();
  expect(screen.queryByText("Controlled effort")).toBeNull();
});

test.each([
  ["SCHEDULED", "bg-zinc-400", "text-zinc-700"],
  ["COMPLETED", "bg-green-600", "text-green-800"],
  ["SKIPPED", "bg-amber-500", "text-amber-800"],
] as const)(
  "renders %s activities with a status label and accent",
  (status, indicatorClass, labelClass) => {
    render(<TrainingActivityCard activity={runActivity({ status })} />);

    const card = screen.getByRole("button", {
      name: "View Tempo run details",
    });
    const statusLabel = screen.getByText(
      status.charAt(0) + status.slice(1).toLowerCase(),
    );

    expect(card.className).not.toContain("border");
    expect(card.className).not.toContain("shadow");
    expect(card.className).not.toMatch(/(^|\s)bg-/);
    expect(statusLabel.className).toContain(labelClass);
    expect(card.querySelector("span")?.className).toContain(indicatorClass);
  },
);

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
