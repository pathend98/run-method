import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

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
  render(
    <ActivityDetailsModal
      activity={runActivity}
      isDeleting={false}
      onClose={onClose}
      onDelete={vi.fn()}
      onEdit={vi.fn()}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Close activity details" }),
  );
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("calls the close handler from the backdrop", () => {
  const onClose = vi.fn();
  render(
    <ActivityDetailsModal
      activity={runActivity}
      isDeleting={false}
      onClose={onClose}
      onDelete={vi.fn()}
      onEdit={vi.fn()}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Dismiss activity details" }),
  );
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("calls the close handler from the Escape key", () => {
  const onClose = vi.fn();
  render(
    <ActivityDetailsModal
      activity={runActivity}
      isDeleting={false}
      onClose={onClose}
      onDelete={vi.fn()}
      onEdit={vi.fn()}
    />,
  );
  fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("ignores non-Escape keys", () => {
  const onClose = vi.fn();
  render(
    <ActivityDetailsModal
      activity={runActivity}
      isDeleting={false}
      onClose={onClose}
      onDelete={vi.fn()}
      onEdit={vi.fn()}
    />,
  );
  fireEvent.keyDown(window, { key: "Enter", code: "Enter" });
  expect(onClose).not.toHaveBeenCalled();
});

test("renders as an accessible large centered modal", () => {
  render(
    <ActivityDetailsModal
      activity={runActivity}
      isDeleting={false}
      onClose={vi.fn()}
      onDelete={vi.fn()}
      onEdit={vi.fn()}
    />,
  );
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
  render(
    <ActivityDetailsModal
      activity={runActivity}
      isDeleting={false}
      onClose={vi.fn()}
      onDelete={vi.fn()}
      onEdit={vi.fn()}
    />,
  );
  const modal = screen.getByRole("dialog", { name: "Tempo run" });
  expect(within(modal).getByText("Distance + Pace")).toBeDefined();
  expect(within(modal).getByText("4:15 / km")).toBeDefined();
});

test("dispatches strength activities to the strength details component", () => {
  render(
    <ActivityDetailsModal
      activity={strengthActivity}
      isDeleting={false}
      onClose={vi.fn()}
      onDelete={vi.fn()}
      onEdit={vi.fn()}
    />,
  );
  const modal = screen.getByRole("dialog", { name: "Strength" });
  expect(within(modal).getByText("45 min")).toBeDefined();
  expect(within(modal).queryByText("Target pace")).toBeNull();
});

test("calls the edit handler", () => {
  const onEdit = vi.fn();
  render(
    <ActivityDetailsModal
      activity={runActivity}
      isDeleting={false}
      onClose={vi.fn()}
      onDelete={vi.fn()}
      onEdit={onEdit}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit activity" }));
  expect(onEdit).toHaveBeenCalledOnce();
});

test("asks for confirmation and allows cancellation", () => {
  const onDelete = vi.fn();
  render(
    <ActivityDetailsModal
      activity={runActivity}
      isDeleting={false}
      onClose={vi.fn()}
      onDelete={onDelete}
      onEdit={vi.fn()}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Delete activity" }));
  expect(screen.getByText("Delete “Tempo run”?")).toBeDefined();
  expect(screen.getByText("This action cannot be undone.")).toBeDefined();

  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByText("Delete “Tempo run”?")).toBeNull();
  expect(onDelete).not.toHaveBeenCalled();
});

test("deletes the activity and closes after success", async () => {
  const onClose = vi.fn();
  const onDelete = vi.fn().mockResolvedValue(undefined);
  render(
    <ActivityDetailsModal
      activity={runActivity}
      isDeleting={false}
      onClose={onClose}
      onDelete={onDelete}
      onEdit={vi.fn()}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Delete activity" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));

  await waitFor(() => expect(onDelete).toHaveBeenCalledOnce());
  expect(onClose).toHaveBeenCalledOnce();
});

test("keeps confirmation open and reports deletion failures", async () => {
  render(
    <ActivityDetailsModal
      activity={runActivity}
      isDeleting={false}
      onClose={vi.fn()}
      onDelete={vi.fn().mockRejectedValue(new Error("nope"))}
      onEdit={vi.fn()}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Delete activity" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));

  expect((await screen.findByRole("alert")).textContent).toContain(
    "Unable to delete activity",
  );
  expect(
    screen.getByRole("button", { name: "Delete permanently" }),
  ).toBeDefined();
});

test("disables confirmation and dismissal while deleting", () => {
  const onClose = vi.fn();
  const { rerender } = render(
    <ActivityDetailsModal
      activity={runActivity}
      isDeleting={false}
      onClose={onClose}
      onDelete={vi.fn()}
      onEdit={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Delete activity" }));

  rerender(
    <ActivityDetailsModal
      activity={runActivity}
      isDeleting
      onClose={onClose}
      onDelete={vi.fn()}
      onEdit={vi.fn()}
    />,
  );

  expect(screen.getByRole("button", { name: "Deleting…" })).toHaveProperty(
    "disabled",
    true,
  );
  expect(screen.getByRole("button", { name: "Cancel" })).toHaveProperty(
    "disabled",
    true,
  );
  expect(
    screen.getByRole("button", { name: "Dismiss activity details" }),
  ).toHaveProperty("disabled", true);
  fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
  expect(onClose).not.toHaveBeenCalled();
});

test("shows skip and complete actions only for scheduled activities", () => {
  const { rerender } = render(
    <ActivityDetailsModal activity={runActivity} isDeleting={false} onClose={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />,
  );
  expect(screen.getByRole("button", { name: "Skip activity" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Complete activity" })).toBeDefined();

  rerender(
    <ActivityDetailsModal activity={{ ...runActivity, status: "COMPLETED" }} isDeleting={false} onClose={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />,
  );
  expect(screen.queryByRole("button", { name: "Skip activity" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Complete activity" })).toBeNull();
});

test("validates a skip reason and closes after a successful skip", async () => {
  const onClose = vi.fn();
  const onSkip = vi.fn().mockResolvedValue(undefined);
  render(<ActivityDetailsModal activity={runActivity} isDeleting={false} onClose={onClose} onDelete={vi.fn()} onEdit={vi.fn()} onSkip={onSkip} />);
  fireEvent.click(screen.getByRole("button", { name: "Skip activity" }));
  fireEvent.click(screen.getByRole("button", { name: "Skip activity" }));
  expect(await screen.findByText("Enter a skip reason")).toBeDefined();
  fireEvent.change(screen.getByLabelText("Skip reason"), { target: { value: "Recovery" } });
  fireEvent.click(screen.getByRole("button", { name: "Skip activity" }));
  await waitFor(() => expect(onSkip).toHaveBeenCalledWith({ skipReason: "Recovery" }));
  expect(onClose).toHaveBeenCalledOnce();
});

test("collects run actuals, handles errors, and can cancel completion", async () => {
  const onComplete = vi.fn().mockRejectedValue(new Error("nope"));
  render(<ActivityDetailsModal activity={runActivity} isDeleting={false} onClose={vi.fn()} onComplete={onComplete} onDelete={vi.fn()} onEdit={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Complete activity" }));
  fireEvent.click(screen.getByRole("button", { name: "Complete activity" }));
  expect(await screen.findByText("Duration must be greater than zero")).toBeDefined();
  expect(screen.getByText("Enter a distance in kilometres")).toBeDefined();
  fireEvent.change(screen.getByLabelText("Actual duration (minutes)"), { target: { value: "42" } });
  fireEvent.change(screen.getByLabelText("Actual distance (km)"), { target: { value: "6.2" } });
  fireEvent.click(screen.getByRole("button", { name: "Complete activity" }));
  await waitFor(() => expect(onComplete).toHaveBeenCalledWith({ actualDurationSeconds: 2520, actualDistanceMetres: 6200 }));
  expect((await screen.findByRole("alert")).textContent).toContain("Unable to complete activity");
  fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[1]);
  expect(screen.queryByLabelText("Actual duration (minutes)")).toBeNull();
});

test("disables the transition form and dismissal while submitting", () => {
  const { rerender } = render(<ActivityDetailsModal activity={strengthActivity} isDeleting={false} onClose={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Complete activity" }));
  rerender(<ActivityDetailsModal activity={strengthActivity} isDeleting={false} isTransitioning onClose={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Completing…" })).toHaveProperty("disabled", true);
  expect(screen.getByRole("button", { name: "Dismiss activity details" })).toHaveProperty("disabled", true);
});

test("uses default transition handlers when none are supplied", async () => {
  const onClose = vi.fn();
  const first = render(<ActivityDetailsModal activity={strengthActivity} isDeleting={false} onClose={onClose} onDelete={vi.fn()} onEdit={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Skip activity" }));
  fireEvent.change(screen.getByLabelText("Skip reason"), { target: { value: "Rest" } });
  fireEvent.click(screen.getByRole("button", { name: "Skip activity" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledOnce());

  first.unmount();
  render(<ActivityDetailsModal activity={strengthActivity} isDeleting={false} onClose={onClose} onDelete={vi.fn()} onEdit={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Complete activity" }));
  fireEvent.change(screen.getByLabelText("Actual duration (minutes)"), { target: { value: "30" } });
  fireEvent.click(screen.getByRole("button", { name: "Complete activity" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(2));
});

test("cancels a transition from the header", () => {
  render(<ActivityDetailsModal activity={strengthActivity} isDeleting={false} onClose={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Skip activity" }));
  fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[0]);
  expect(screen.queryByLabelText("Skip reason")).toBeNull();
});

test("reports skip failures and labels a pending skip", async () => {
  const { rerender } = render(<ActivityDetailsModal activity={strengthActivity} isDeleting={false} onClose={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} onSkip={vi.fn().mockRejectedValue(new Error("nope"))} />);
  fireEvent.click(screen.getByRole("button", { name: "Skip activity" }));
  fireEvent.change(screen.getByLabelText("Skip reason"), { target: { value: "Rest" } });
  fireEvent.click(screen.getByRole("button", { name: "Skip activity" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Unable to skip activity");
  rerender(<ActivityDetailsModal activity={strengthActivity} isDeleting={false} isTransitioning onClose={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Skipping…" })).toHaveProperty("disabled", true);
});
