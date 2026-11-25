import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TrainingGoalForm } from "./training-goal-form";

function fillForm() {
  for (const [label, value] of Object.entries({
    Title: "  Marathon  ",
    Purpose: "  Build fitness  ",
    "Training intentions": "  Run consistently  ",
    "Start date": "2026-11-01",
    "Target date": "2026-12-01",
  })) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
}

test("renders the five required fields with empty defaults", () => {
  render(<TrainingGoalForm onSubmit={vi.fn()} />);
  for (const label of [
    "Title",
    "Purpose",
    "Training intentions",
    "Start date",
    "Target date",
  ]) {
    expect(screen.getByLabelText(label)).toHaveProperty("value", "");
  }
  expect(screen.queryByLabelText("Goal type")).toBeNull();
});

test("shows validation errors without submitting", async () => {
  const onSubmit = vi.fn();
  render(<TrainingGoalForm onSubmit={onSubmit} />);
  fireEvent.click(screen.getByRole("button", { name: "Create training goal" }));
  await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(5));
  expect(onSubmit).not.toHaveBeenCalled();
});

test("submits the five trimmed fields and disables controls while saving", async () => {
  let finish!: () => void;
  const onSubmit = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  render(<TrainingGoalForm onSubmit={onSubmit} />);
  fillForm();
  fireEvent.click(screen.getByRole("button", { name: "Create training goal" }));
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith({
      title: "Marathon",
      purpose: "Build fitness",
      trainingIntentions: "Run consistently",
      startDate: "2026-11-01",
      targetDate: "2026-12-01",
    }),
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
  render(<TrainingGoalForm onSubmit={onSubmit} />);
  fillForm();
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
