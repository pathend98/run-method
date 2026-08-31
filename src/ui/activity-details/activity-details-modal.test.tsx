import { fireEvent, render, screen, within } from "@testing-library/react";

import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import { ActivityDetailsModal } from "./activity-details-modal";

const runActivity = {
  id: "run",
  title: "Tempo run",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: "Controlled effort",
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T11:30:00.000Z",
  activityType: "RUN",
  targetType: "DISTANCE_PACE",
  targetDistanceMetres: 6000,
  targetDurationSeconds: null,
  targetPaceSecondsPerKilometre: 255,
  actualDistanceMetres: 5900,
  actualDurationSeconds: 1500,
} satisfies RunTrainingSession;

const strengthActivity = {
  ...runActivity,
  id: "strength",
  title: "Strength",
  activityType: "STRENGTH",
  timeOfDay: "PM",
  targetDurationSeconds: 2700,
  actualDurationSeconds: 2400,
} satisfies StrengthTrainingSession;

test("calls the close handler from the close button", () => {
  const onClose = vi.fn();
  render(<ActivityDetailsModal activity={runActivity} onClose={onClose} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Close activity details" }),
  );
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("calls the close handler from the backdrop", () => {
  const onClose = vi.fn();
  render(<ActivityDetailsModal activity={runActivity} onClose={onClose} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Dismiss activity details" }),
  );
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("calls the close handler from the Escape key", () => {
  const onClose = vi.fn();
  render(<ActivityDetailsModal activity={runActivity} onClose={onClose} />);
  fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("ignores non-Escape keys", () => {
  const onClose = vi.fn();
  render(<ActivityDetailsModal activity={runActivity} onClose={onClose} />);
  fireEvent.keyDown(window, { key: "Enter", code: "Enter" });
  expect(onClose).not.toHaveBeenCalled();
});

test("renders as an accessible large centered modal", () => {
  render(<ActivityDetailsModal activity={runActivity} onClose={vi.fn()} />);
  const modal = screen.getByRole("dialog", { name: "Tempo run" });
  const overlay = modal.parentElement;
  expect(overlay?.classList.contains("items-center")).toBe(true);
  expect(overlay?.classList.contains("justify-center")).toBe(true);
  expect(modal.classList.contains("max-w-4xl")).toBe(true);
  expect(modal.classList.contains("max-h-[calc(100dvh-2rem)]")).toBe(true);
  expect(modal.classList.contains("rounded-xl")).toBe(true);
  expect(modal.classList.contains("overflow-y-auto")).toBe(true);
  expect(
    within(modal).getByRole("heading", { level: 2, name: "Tempo run" }),
  ).toBeDefined();
});

test("dispatches run activities to the run details component", () => {
  render(<ActivityDetailsModal activity={runActivity} onClose={vi.fn()} />);
  const modal = screen.getByRole("dialog", { name: "Tempo run" });
  expect(within(modal).getByText("Distance + Pace")).toBeDefined();
  expect(within(modal).getByText("4:15 / km")).toBeDefined();
});

test("dispatches strength activities to the strength details component", () => {
  render(
    <ActivityDetailsModal activity={strengthActivity} onClose={vi.fn()} />,
  );
  const modal = screen.getByRole("dialog", { name: "Strength" });
  expect(within(modal).getByText("45 min")).toBeDefined();
  expect(within(modal).queryByText("Target pace")).toBeNull();
});
