import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CreateTrainingGoal } from "./index";

const purpose = "What do you want this period of training to help you develop?";
const intentions = "How will you approach your training?";

async function continueForm() {
  fireEvent.submit(document.querySelector("form")!);
  await waitFor(() =>
    expect(screen.getByRole("heading")).toHaveProperty(
      "textContent",
      "Training intentions",
    ),
  );
}

async function fillForm() {
  fireEvent.change(screen.getByLabelText(purpose, { exact: false }), {
    target: { value: "  Build fitness  " },
  });
  await continueForm();
  fireEvent.change(screen.getByLabelText(intentions, { exact: false }), {
    target: { value: "  Run consistently  " },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await screen.findByLabelText("Goal name");
  for (const [label, value] of Object.entries({
    "Goal name": "  Marathon  ",
    "Start date": "2026-11-01",
    "Target date": "2026-12-01",
  })) {
    fireEvent.change(screen.getByLabelText(label, { exact: false }), {
      target: { value },
    });
  }
}

test("introduces first-time users before showing any fields", () => {
  render(<CreateTrainingGoal showIntroduction onSubmit={vi.fn()} />);
  expect(
    screen.getByRole("heading", { name: "Give your training direction" }),
  ).toBeDefined();
  expect(screen.getByText(/You don't need to achieve/)).toBeDefined();
  expect(screen.queryByRole("textbox")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Get started" }));
  expect(screen.getByRole("heading", { name: "Training purpose" })).toBe(
    document.activeElement,
  );
  expect(screen.getByRole("status").textContent).toBe("Step 1 of 3");
});

test("validates only the current stage and preserves answers when going back", async () => {
  const onSubmit = vi.fn();
  render(<CreateTrainingGoal showIntroduction={false} onSubmit={onSubmit} />);
  expect(screen.getAllByRole("textbox")).toHaveLength(1);
  expect(screen.getByLabelText(purpose, { exact: false })).toHaveProperty(
    "value",
    "",
  );
  expect(screen.getByText(/Describe your reason/)).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(await screen.findAllByRole("alert")).toHaveLength(1);
  expect(document.activeElement).toBe(
    screen.getByLabelText(purpose, { exact: false }),
  );
  fireEvent.change(screen.getByLabelText(purpose, { exact: false }), {
    target: { value: "Build fitness" },
  });
  await continueForm();
  expect(screen.getByText(/Describe the actions/)).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(await screen.findAllByRole("alert")).toHaveLength(1);
  fireEvent.change(screen.getByLabelText(intentions, { exact: false }), {
    target: { value: "Recover well" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByLabelText(purpose, { exact: false })).toHaveProperty(
    "value",
    "Build fitness",
  );
  await continueForm();
  expect(screen.getByLabelText(intentions, { exact: false })).toHaveProperty(
    "value",
    "Recover well",
  );
  expect(onSubmit).not.toHaveBeenCalled();
});

test("validates the period and date ordering before saving", async () => {
  const onSubmit = vi.fn();
  render(<CreateTrainingGoal showIntroduction={false} onSubmit={onSubmit} />);
  await fillForm();
  for (const label of ["Goal name", "Start date", "Target date"]) {
    fireEvent.change(screen.getByLabelText(label, { exact: false }), {
      target: { value: "" },
    });
  }
  fireEvent.click(screen.getByRole("button", { name: "Create training goal" }));
  expect(await screen.findAllByRole("alert")).toHaveLength(3);
  fireEvent.change(screen.getByLabelText("Goal name", { exact: false }), {
    target: { value: "Marathon" },
  });
  fireEvent.change(screen.getByLabelText("Start date", { exact: false }), {
    target: { value: "2026-11-01" },
  });
  fireEvent.change(screen.getByLabelText("Target date", { exact: false }), {
    target: { value: "2026-10-31" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create training goal" }));
  expect(
    await screen.findByText("Target date must be on or after start date"),
  ).toBeDefined();
  expect(onSubmit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(await screen.findByLabelText("Goal name")).toHaveProperty(
    "value",
    "Marathon",
  );
});

test("saves trimmed fields and prevents repeated submissions while saving", async () => {
  let finish!: () => void;
  const onSubmit = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  render(<CreateTrainingGoal showIntroduction={false} onSubmit={onSubmit} />);
  await fillForm();
  fireEvent.submit(document.querySelector("form")!);
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
  fireEvent.submit(document.querySelector("form")!);
  expect(onSubmit).toHaveBeenCalledTimes(1);
  finish();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Create training goal" }),
    ).toHaveProperty("disabled", false),
  );
});

test("preserves values on failure and permits retry", async () => {
  const onSubmit = vi
    .fn()
    .mockRejectedValueOnce(new Error("Failed"))
    .mockResolvedValue(undefined);
  render(<CreateTrainingGoal showIntroduction={false} onSubmit={onSubmit} />);
  await fillForm();
  fireEvent.click(screen.getByRole("button", { name: "Create training goal" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Unable to create training goal. Please try again.",
  );
  expect(screen.getByLabelText("Goal name", { exact: false })).toHaveProperty(
    "value",
    "  Marathon  ",
  );
  fireEvent.click(screen.getByRole("button", { name: "Create training goal" }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
});
