import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SkipTrainingSessionForm } from "./skip-training-session-form";

const skipReasonLabelText = "Why are you skipping this training session?";

test("validates and submits a skip reason", async () => {
  const onSkip = vi.fn().mockResolvedValue(undefined);
  render(<SkipTrainingSessionForm isSubmitting={false} onSkip={onSkip} />);

  fireEvent.submit(screen.getByLabelText(skipReasonLabelText).closest("form")!);
  expect(await screen.findByText("Enter a skip reason")).toBeDefined();
  fireEvent.change(screen.getByLabelText(skipReasonLabelText), {
    target: { value: "  Recovery  " },
  });
  fireEvent.submit(screen.getByLabelText(skipReasonLabelText).closest("form")!);
  await waitFor(() =>
    expect(onSkip).toHaveBeenCalledWith({ skipReason: "Recovery" }),
  );
});

test("validates an empty skip reason after blur", async () => {
  render(<SkipTrainingSessionForm isSubmitting={false} onSkip={vi.fn()} />);

  fireEvent.blur(screen.getByLabelText(skipReasonLabelText));

  expect(await screen.findByText("Enter a skip reason")).toBeDefined();
});

test("disables the skip field while submitting", () => {
  render(<SkipTrainingSessionForm isSubmitting onSkip={vi.fn()} />);
  expect(screen.getByLabelText(skipReasonLabelText)).toHaveProperty(
    "disabled",
    true,
  );
});

test("reports submission failures", async () => {
  render(
    <SkipTrainingSessionForm
      isSubmitting={false}
      onSkip={vi.fn().mockRejectedValue(new Error("nope"))}
    />,
  );

  fireEvent.change(screen.getByLabelText(skipReasonLabelText), {
    target: { value: "Recovery" },
  });
  fireEvent.submit(screen.getByLabelText(skipReasonLabelText).closest("form")!);
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Unable to skip training session",
  );
});
