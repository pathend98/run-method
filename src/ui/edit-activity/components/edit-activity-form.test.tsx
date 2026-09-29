import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { RunTrainingSession } from "@/domain/training-sessions";
import {
  createRunActivity,
  createStrengthActivity,
} from "@/test-support/fixtures/activity";
import { EditActivityForm } from "./edit-activity-form";
import { DistanceDisplayProvider } from "@/ui/users/measurement-unit-context";

const runActivity = createRunActivity({
  description: "Controlled effort",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1530,
}) satisfies RunTrainingSession;

const strengthActivity = createStrengthActivity({
  id: "22222222-2222-4222-8222-222222222222",
  description: runActivity.description,
});

test("renders pre-populated editable fields for a scheduled run", () => {
  render(
    <EditActivityForm
      activity={runActivity}
      onClose={vi.fn()}
      onEdit={vi.fn()}
    />,
  );

  expect(screen.getByLabelText("Title")).toHaveProperty("value", "Tempo run");
  expect(screen.getByLabelText("Day")).toHaveProperty("value", "2026-08-17");
  expect(
    Array.from(screen.getByLabelText("Day").querySelectorAll("option")).map(
      (option) => [option.textContent, option.value],
    ),
  ).toEqual([
    ["Monday 17 Aug", "2026-08-17"],
    ["Tuesday 18 Aug", "2026-08-18"],
    ["Wednesday 19 Aug", "2026-08-19"],
    ["Thursday 20 Aug", "2026-08-20"],
    ["Friday 21 Aug", "2026-08-21"],
    ["Saturday 22 Aug", "2026-08-22"],
    ["Sunday 23 Aug", "2026-08-23"],
  ]);
  expect(screen.getByLabelText("Time of day")).toHaveProperty("value", "AM");
  expect(
    Array.from(
      screen.getByLabelText("Time of day").querySelectorAll("option"),
    ).map((option) => [option.textContent, option.value]),
  ).toEqual([
    ["Morning", "AM"],
    ["Anytime", "ANY"],
    ["Evening", "PM"],
  ]);
  expect(screen.getByLabelText("Distance (km)")).toHaveProperty("value", "6");
  expect(screen.getByLabelText("Pace (mm:ss / km) · Auto")).toHaveProperty(
    "value",
    "4:15",
  );
  expect(screen.getByText("Duration (hh:mm:ss)")).toBeDefined();
  expect(screen.getByLabelText("Duration (minutes)")).toHaveProperty(
    "value",
    "25",
  );
  expect(screen.getByLabelText("Duration (hh:mm:ss) seconds")).toHaveProperty(
    "value",
    "30",
  );
});

test("prefills mile values and preserves exact metres on a title edit", async () => {
  const onEdit = vi.fn().mockResolvedValue(undefined);
  render(
    <DistanceDisplayProvider measurementUnit="MILES">
      <EditActivityForm
        activity={{ ...runActivity, targetDistanceMetres: 8001 }}
        onClose={vi.fn()}
        onEdit={onEdit}
      />
    </DistanceDisplayProvider>,
  );
  expect(screen.getByLabelText("Distance (mi)")).toHaveProperty(
    "value",
    "4.972",
  );
  expect(screen.getByLabelText("Pace (mm:ss / mi) · Auto")).toHaveProperty(
    "value",
    "5:08",
  );
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Updated tempo" },
  });
  fireEvent.submit(screen.getByLabelText("Title").closest("form")!);
  await waitFor(() =>
    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ targetDistanceMetres: 8001 }),
    ),
  );
});

test("validates an empty title after blur", async () => {
  render(
    <EditActivityForm
      activity={runActivity}
      onClose={vi.fn()}
      onEdit={vi.fn()}
    />,
  );

  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "" } });
  fireEvent.blur(screen.getByLabelText("Title"));

  expect(await screen.findByText("Enter an activity title")).toBeDefined();
});

test("submits an edit and closes the form", async () => {
  const onClose = vi.fn();
  const onEdit = vi.fn().mockResolvedValue(undefined);
  render(
    <EditActivityForm
      activity={runActivity}
      onClose={onClose}
      onEdit={onEdit}
    />,
  );
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Updated tempo" },
  });
  fireEvent.change(screen.getByLabelText("Day"), {
    target: { value: "2026-08-19" },
  });
  fireEvent.change(screen.getByLabelText("Time of day"), {
    target: { value: "PM" },
  });
  fireEvent.submit(screen.getByLabelText("Title").closest("form")!);

  await waitFor(() => expect(onEdit).toHaveBeenCalledOnce());
  expect(onEdit).toHaveBeenCalledWith(
    expect.objectContaining({
      activityType: "RUN",
      title: "Updated tempo",
      date: "2026-08-19",
      timeOfDay: "PM",
    }),
  );
  expect(onClose).toHaveBeenCalledOnce();
});

test("keeps the form open and reports a failed edit", async () => {
  const onClose = vi.fn();
  render(
    <EditActivityForm
      activity={runActivity}
      onClose={onClose}
      onEdit={vi.fn().mockRejectedValue(new Error("nope"))}
    />,
  );
  fireEvent.submit(screen.getByLabelText("Title").closest("form")!);

  expect((await screen.findByRole("alert")).textContent).toContain(
    "Unable to edit activity",
  );
  expect(onClose).not.toHaveBeenCalled();
});

test("shows validation errors without submitting", async () => {
  const onEdit = vi.fn();
  render(
    <EditActivityForm
      activity={runActivity}
      onClose={vi.fn()}
      onEdit={onEdit}
    />,
  );
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "" } });
  fireEvent.submit(screen.getByLabelText("Title").closest("form")!);

  expect(await screen.findByText("Enter an activity title")).toBeDefined();
  expect(onEdit).not.toHaveBeenCalled();
});

test("renders editable actual metrics for completed runs", () => {
  render(
    <EditActivityForm
      activity={{
        ...runActivity,
        status: "COMPLETED",
        actualDistanceMetres: 5900,
        actualDurationSeconds: 1500,
      }}
      onClose={vi.fn()}
      onEdit={vi.fn()}
    />,
  );

  expect(screen.queryByLabelText("Time of day")).toBeNull();
  expect(screen.queryByLabelText("Day")).toBeNull();
  expect(screen.getByRole("heading", { name: "Actual metrics" })).toBeDefined();
  expect(screen.getByLabelText("Distance (km)")).toHaveProperty("value", "5.9");
  expect(screen.getByLabelText("Pace (mm:ss / km) · Auto")).toHaveProperty(
    "value",
    "4:14",
  );
});

test("renders an editable duration for scheduled strength activities", () => {
  render(
    <EditActivityForm
      activity={strengthActivity}
      onClose={vi.fn()}
      onEdit={vi.fn()}
    />,
  );

  expect(screen.getByLabelText("Time of day")).toBeDefined();
  expect(screen.getByLabelText("Duration (minutes, optional)")).toHaveProperty(
    "value",
    "45",
  );
  expect(screen.queryByLabelText("Distance (km)")).toBeNull();
});

test("renders editable actual duration for completed strength activities", () => {
  render(
    <EditActivityForm
      activity={{
        ...strengthActivity,
        status: "COMPLETED",
        actualDurationSeconds: 2400,
      }}
      onClose={vi.fn()}
      onEdit={vi.fn()}
    />,
  );

  expect(screen.getByLabelText("Actual duration (minutes)")).toHaveProperty(
    "value",
    "40",
  );
});

test("does not render metrics for skipped activities", () => {
  render(
    <EditActivityForm
      activity={{ ...runActivity, status: "SKIPPED", skipReason: "Rest" }}
      onClose={vi.fn()}
      onEdit={vi.fn()}
    />,
  );

  expect(screen.queryByRole("heading", { name: "Actual metrics" })).toBeNull();
  expect(screen.queryByLabelText("Day")).toBeNull();
  expect(screen.queryByLabelText("Distance (km)")).toBeNull();
});
