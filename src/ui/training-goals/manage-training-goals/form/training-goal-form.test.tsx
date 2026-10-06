import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TrainingGoalForm } from "./training-goal-form";

function fillTitle() {
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "  Marathon  " },
  });
}

test("renders all fields with optional targets and race selected", () => {
  render(<TrainingGoalForm unit="KILOMETRES" onSubmit={vi.fn()} />);
  expect(screen.getByLabelText("Goal type")).toHaveProperty("value", "RACE");
  expect(screen.getAllByRole("option")).toHaveLength(4);
  expect(screen.getByLabelText("Target distance (km, optional)")).toBeDefined();
  expect(screen.getByLabelText("Target date (optional)")).toBeDefined();
  expect(screen.getByLabelText("Description (optional)")).toBeDefined();
});

test("shows validation errors without submitting", async () => {
  const onSubmit = vi.fn();
  render(<TrainingGoalForm unit="KILOMETRES" onSubmit={onSubmit} />);
  fireEvent.click(screen.getByRole("button", { name: "Create training goal" }));
  expect(await screen.findByText("Enter a goal title")).toBeDefined();
  expect(onSubmit).not.toHaveBeenCalled();
});

test("submits targets in miles and disables controls while saving", async () => {
  let finish!: () => void;
  const onSubmit = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  render(<TrainingGoalForm unit="MILES" onSubmit={onSubmit} />);
  fillTitle();
  fireEvent.change(screen.getByLabelText("Target distance (mi, optional)"), {
    target: { value: "10" },
  });
  fireEvent.change(screen.getByLabelText("Target time (minutes, optional)"), {
    target: { value: "45" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create training goal" }));
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Marathon",
        targetDistanceMetres: 16093,
        targetTimeSeconds: 2700,
      }),
    ),
  );
  expect(screen.getByRole("button", { name: "Creating…" })).toHaveProperty(
    "disabled",
    true,
  );
  expect(document.querySelector("fieldset")).toHaveProperty("disabled", true);
  finish();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Create training goal" }),
    ).toHaveProperty("disabled", false),
  );
});

test("preserves values on failure and allows retry", async () => {
  const onSubmit = vi
    .fn()
    .mockRejectedValueOnce(new Error("Failed"))
    .mockResolvedValue(undefined);
  render(<TrainingGoalForm unit="KILOMETRES" onSubmit={onSubmit} />);
  fillTitle();
  fireEvent.click(screen.getByRole("button", { name: "Create training goal" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Unable to create training goal. Please try again.",
  );
  expect(screen.getByLabelText("Title")).toHaveProperty(
    "value",
    "  Marathon  ",
  );
  fireEvent.click(screen.getByRole("button", { name: "Create training goal" }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
});
